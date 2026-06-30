-- ProofChain: Cryptographic proof integrity system
-- Adds content hashing, trust tiers, and chain events to proof cards

-- Add new columns to proof_cards
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS previous_hash text;
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS chain_version integer DEFAULT 1;
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS trust_tier text DEFAULT 'none' CHECK (trust_tier IN ('none', 'bronze', 'silver', 'gold'));
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE proof_cards ADD COLUMN IF NOT EXISTS verification_count integer DEFAULT 0;

-- Index for hash-based lookups
CREATE INDEX IF NOT EXISTS idx_proof_cards_content_hash ON proof_cards (content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proof_cards_trust_tier ON proof_cards (trust_tier) WHERE trust_tier != 'none';

-- Chain events table: immutable audit trail
CREATE TABLE IF NOT EXISTS proof_chain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id uuid NOT NULL REFERENCES proof_cards(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'verified', 'updated', 'signed', 'anchored')),
  content_hash text NOT NULL,
  previous_hash text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Index for chain lookups
CREATE INDEX IF NOT EXISTS idx_proof_chain_events_proof_id ON proof_chain_events (proof_id, created_at);

-- RLS: users can read chain events for their own proofs or public proofs
ALTER TABLE proof_chain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proof chain events"
  ON proof_chain_events FOR SELECT
  USING (
    proof_id IN (
      SELECT id FROM proof_cards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public proof chain events are viewable"
  ON proof_chain_events FOR SELECT
  USING (
    proof_id IN (
      SELECT id FROM proof_cards WHERE visibility = 'public'
    )
  );

CREATE POLICY "System can insert chain events"
  ON proof_chain_events FOR INSERT
  WITH CHECK (true);

-- Function to auto-set last_verified_at on verification
CREATE OR REPLACE FUNCTION update_proof_last_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    NEW.last_verified_at = now();
    NEW.verification_count = COALESCE(OLD.verification_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proof_last_verified
  BEFORE UPDATE ON proof_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_proof_last_verified();
