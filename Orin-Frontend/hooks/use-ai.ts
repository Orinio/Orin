'use client';

import { useState, useCallback } from 'react';
import { 
  runAgent, 
  verifyProof, 
  analyzeProofQuality, 
  extractSkillsFromText,
  generateEmbedding,
  analyzeImage,
  checkContentSafety,
  type AgentResult 
} from '@/lib/ai';

// ============================================================
// Chat Hook
// ============================================================
export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<AgentResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await runAgent(message);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}

// ============================================================
// Proof Verification Hook
// ============================================================
export function useProofVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (proofUrl: string, sourceType: string): Promise<AgentResult | null> => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyProof(proofUrl, sourceType);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify proof';
      setError(errorMessage);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return { verify, isVerifying, error };
}

// ============================================================
// Skill Extraction Hook
// ============================================================
export function useSkillExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSkills = useCallback(async (text: string): Promise<AgentResult | null> => {
    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractSkillsFromText(text);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract skills';
      setError(errorMessage);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return { extractSkills, isExtracting, error };
}

// ============================================================
// Embedding Hook
// ============================================================
export function useEmbedding() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (text: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateEmbedding(text);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate embedding';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating, error };
}

// ============================================================
// Vision Hook
// ============================================================
export function useVision() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (imageUrl: string, prompt?: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeImage(imageUrl, prompt);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyze, isAnalyzing, error };
}

// ============================================================
// Safety Check Hook
// ============================================================
export function useSafetyCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (text: string) => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await checkContentSafety(text);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check safety';
      setError(errorMessage);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { check, isChecking, error };
}

// ============================================================
// Portfolio Analysis Hook
// ============================================================
export function usePortfolioAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (proof: {
    title: string;
    description?: string;
    skills: string[];
    sourceType: string;
    url?: string;
  }): Promise<AgentResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeProofQuality(proof);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze portfolio';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyze, isAnalyzing, error };
}
