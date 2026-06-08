-- Comprehensive seed data for demo purposes
-- This ensures the platform has data to show even for new users

-- Seed opportunities (comprehensive set)
INSERT INTO opportunities (title, company, type, required_skills, nice_to_have, description, location, is_remote, link, apply_deadline, match_percentage, salary_min, salary_max, salary_currency, source, is_active, metadata) VALUES
-- Internships
('Software Engineering Intern', 'Google', 'internship', ARRAY['Python', 'Java', 'Data Structures', 'Algorithms'], ARRAY['Machine Learning', 'Cloud Computing'], 'Join Google as a software engineering intern. Work on projects that impact billions of users.', 'Mountain View, CA', false, 'https://careers.google.com/jobs/results/internship/', '2026-09-01', 85, 8000, 10000, 'USD', 'google_careers', true, '{"duration": "12 weeks", "season": "Summer 2026"}'::jsonb),

('Frontend Engineering Intern', 'Meta', 'internship', ARRAY['React', 'TypeScript', 'JavaScript', 'CSS'], ARRAY['GraphQL', 'React Native', 'Next.js'], 'Build the next generation of social experiences at Meta.', 'Menlo Park, CA', false, 'https://careers.meta.com/internships/', '2026-08-15', 78, 7500, 9500, 'USD', 'meta_careers', true, '{"duration": "12 weeks", "season": "Summer 2026"}'::jsonb),

('Data Science Intern', 'Netflix', 'internship', ARRAY['Python', 'SQL', 'Machine Learning', 'Statistics'], ARRAY['Spark', 'TensorFlow', 'A/B Testing'], 'Use data to drive content decisions at Netflix.', 'Los Gatos, CA', false, 'https://jobs.netflix.com/', '2026-07-30', 72, 7000, 9000, 'USD', 'netflix_careers', true, '{"duration": "6 months"}'::jsonb),

('ML Engineering Intern', 'OpenAI', 'internship', ARRAY['Python', 'PyTorch', 'Machine Learning', 'Deep Learning'], ARRAY['Transformers', 'CUDA', 'Distributed Systems'], 'Work on cutting-edge AI research at OpenAI.', 'San Francisco, CA', false, 'https://openai.com/careers/', '2026-08-01', 90, 8500, 11000, 'USD', 'openai_careers', true, '{"duration": "12 weeks", "season": "Summer 2026"}'::jsonb),

('Backend Engineering Intern', 'Stripe', 'internship', ARRAY['Ruby', 'Python', 'Go', 'SQL'], ARRAY['Distributed Systems', 'Payment Systems', 'API Design'], 'Help build the economic infrastructure for the internet.', 'San Francisco, CA', true, 'https://stripe.com/jobs/', '2026-07-15', 80, 8000, 10500, 'USD', 'stripe_careers', true, '{"duration": "12 weeks"}'::jsonb),

('Cloud Engineering Intern', 'Amazon Web Services', 'internship', ARRAY['Python', 'AWS', 'Linux', 'Networking'], ARRAY['Docker', 'Kubernetes', 'Terraform'], 'Build and scale cloud infrastructure at AWS.', 'Seattle, WA', false, 'https://www.amazon.jobs/', '2026-08-20', 75, 7000, 9000, 'USD', 'amazon_jobs', true, '{"duration": "12 weeks", "team": "AWS"}'::jsonb),

('iOS Engineering Intern', 'Apple', 'internship', ARRAY['Swift', 'UIKit', 'SwiftUI', 'iOS'], ARRAY['Core Data', 'ARKit', 'Core ML'], 'Create innovative mobile experiences at Apple.', 'Cupertino, CA', false, 'https://www.apple.com/careers/', '2026-09-15', 82, 8000, 10000, 'USD', 'apple_careers', true, '{"duration": "12 weeks"}'::jsonb),

('Full Stack Intern', 'Shopify', 'internship', ARRAY['Ruby on Rails', 'React', 'TypeScript', 'GraphQL'], ARRAY['Ruby', 'PostgreSQL', 'Redis'], 'Build the future of commerce at Shopify.', 'Toronto, Canada', true, 'https://www.shopify.com/careers/', '2026-07-20', 76, 6500, 8500, 'CAD', 'shopify_careers', true, '{"duration": "16 weeks"}'::jsonb),

-- Full-time Jobs
('Senior Frontend Engineer', 'Vercel', 'job', ARRAY['React', 'Next.js', 'TypeScript', 'Tailwind CSS'], ARRAY['Vercel Platform', 'Edge Functions', 'Web Performance'], 'Join the team behind Next.js and build the future of web development.', 'San Francisco, CA', true, 'https://vercel.com/careers', '2026-12-31', 88, 150000, 200000, 'USD', 'vercel_careers', true, '{"level": "Senior", "team": "Frontend"}'::jsonb),

('Software Engineer', 'GitHub', 'job', ARRAY['Ruby', 'React', 'TypeScript', 'Git'], ARRAY['Go', 'PostgreSQL', 'Redis'], 'Help developers worldwide collaborate more effectively.', 'San Francisco, CA', true, 'https://github.com/careers', '2026-12-31', 82, 130000, 180000, 'USD', 'github_careers', true, '{"level": "Mid-level"}'::jsonb),

('Backend Engineer', 'Supabase', 'job', ARRAY['TypeScript', 'PostgreSQL', 'Go', 'Edge Functions'], ARRAY['Firebase', 'Real-time', 'RLS'], 'Build the open source Firebase alternative.', 'Remote', true, 'https://supabase.com/careers', '2026-11-30', 85, 120000, 170000, 'USD', 'supabase_careers', true, '{"level": "Mid-level", "remote": true}'::jsonb),

('DevOps Engineer', 'Cloudflare', 'job', ARRAY['Linux', 'Networking', 'Python', 'Go'], ARRAY['Kubernetes', 'Terraform', 'CI/CD'], 'Help build a faster, safer internet.', 'Austin, TX', true, 'https://www.cloudflare.com/careers/', '2026-10-15', 78, 120000, 160000, 'USD', 'cloudflare_careers', true, '{"level": "Mid-level"}'::jsonb),

('Data Engineer', 'Databricks', 'job', ARRAY['Python', 'SQL', 'Apache Spark', 'Data Modeling'], ARRAY['Delta Lake', 'MLflow', 'Cloud Platforms'], 'Build the lakehouse platform for data and AI.', 'San Francisco, CA', true, 'https://www.databricks.com/company/careers', '2026-11-01', 80, 140000, 190000, 'USD', 'databricks_careers', true, '{"level": "Mid-level"}'::jsonb),

-- Scholarships
('Women in Tech Scholarship', 'Goldman Sachs', 'scholarship', ARRAY['Computer Science', 'Engineering', 'Mathematics'], ARRAY['Finance', 'Data Science'], 'Supporting women pursuing careers in technology and finance.', 'Global', true, 'https://www.goldmansachs.com/careers/students/programs/', '2026-10-01', 70, 10000, 15000, 'USD', 'goldman_sachs', true, '{"amount": "$10,000-$15,000", "deadline": "October 2026"}'::jsonb),

('Underrepresented Minorities in CS', 'Microsoft', 'scholarship', ARRAY['Computer Science', 'Software Engineering'], ARRAY['AI/ML', 'Cloud Computing'], 'Microsoft扶持有色人种学生进入计算机科学领域。', 'Global', true, 'https://www.microsoft.com/en-us/diversity/', '2026-09-15', 75, 5000, 20000, 'USD', 'microsoft_diversity', true, '{"amount": "$5,000-$20,000"}'::jsonb),

('India STEM Scholarship', 'Tata Consultancy Services', 'scholarship', ARRAY['STEM', 'Computer Science', 'Engineering'], ARRAY['Innovation', 'Research'], 'Supporting Indian students in STEM fields.', 'India', false, 'https://www.tcs.com/careers/', '2026-08-30', 65, 3000, 8000, 'USD', 'tcs_scholarship', true, '{"amount": "$3,000-$8,000", "region": "India"}'::jsonb),

-- Mentorship
('AI/ML Mentorship Program', 'Anthropic', 'mentorship', ARRAY['Machine Learning', 'Python', 'AI Safety'], ARRAY['Research', 'Publications'], 'Get mentored by leading AI researchers at Anthropic.', 'San Francisco, CA', true, 'https://www.anthropic.com/careers/', '2026-09-30', 88, 0, 0, 'USD', 'anthropic_mentorship', true, '{"duration": "6 months", "spots": 20}'::jsonb),

('Startup Mentorship Track', 'Y Combinator', 'mentorship', ARRAY['Entrepreneurship', 'Product Development', 'Fundraising'], ARRAY['Technical Leadership', 'Growth'], 'Get guidance from YC partners and successful founders.', 'San Francisco, CA', true, 'https://www.ycombinator.com/', '2026-10-15', 92, 0, 0, 'USD', 'yc_mentorship', true, '{"duration": "3 months", "program": "YC Start School"}'::jsonb),

-- Hackathons
('Global AI Hackathon', 'Devpost', 'hackathon', ARRAY['AI/ML', 'Python', 'API Integration'], ARRAY['Computer Vision', 'NLP', 'LLMs'], 'Build innovative AI solutions in 48 hours. $50K in prizes.', 'Global', true, 'https://devpost.com/hackathons/', '2026-07-01', 75, 0, 50000, 'USD', 'devpost_hackathon', true, '{"prizes": "$50,000", "duration": "48 hours"}'::jsonb),

('Climate Tech Hackathon', 'HackMIT', 'hackathon', ARRAY['Climate Science', 'Data Visualization', 'Full Stack'], ARRAY['IoT', 'Blockchain', 'Mobile'], 'Build technology solutions for climate change.', 'Cambridge, MA', false, 'https://hackmit.org/', '2026-09-10', 70, 0, 25000, 'USD', 'hackmit', true, '{"prizes": "$25,000", "duration": "24 hours"}'::jsonb),

-- Research
('Quantum Computing Research', 'IBM Research', 'research', ARRAY['Quantum Computing', 'Linear Algebra', 'Python'], ARRAY['Qiskit', 'Physics', 'Mathematics'], 'Join IBM Research to advance quantum computing.', 'Yorktown Heights, NY', false, 'https://research.ibm.com/', '2026-08-01', 85, 0, 0, 'USD', 'ibm_research', true, '{"type": "Research internship", "duration": "Summer 2026"}'::jsonb),

('NLP Research Intern', 'Hugging Face', 'research', ARRAY['NLP', 'Transformers', 'Python', 'PyTorch'], ARRAY['Diffusion Models', 'Open Source', 'Documentation'], 'Work on open-source NLP models at Hugging Face.', 'Paris, France', true, 'https://huggingface.co/jobs', '2026-07-15', 90, 0, 0, 'USD', 'huggingface_jobs', true, '{"type": "Research internship", "remote": true}'::jsonb),

-- Other
('Open Source Maintainer Fellowship', 'GitHub Sponsors', 'other', ARRAY['Open Source', 'Community Building', 'Documentation'], ARRAY['Project Management', 'Technical Writing'], 'Get funded to maintain open source projects.', 'Global', true, 'https://github.com/sponsors/', '2026-12-31', 78, 3000, 10000, 'USD', 'github_sponsors', true, '{"type": "Fellowship", "duration": "1 year"}'::jsonb),

('Technical Writing Residency', 'Dev.to', 'other', ARRAY['Technical Writing', 'JavaScript', 'Web Development'], ARRAY['SEO', 'Community Management'], 'Write technical articles and grow the developer community.', 'Remote', true, 'https://dev.to/', '2026-08-15', 72, 2000, 5000, 'USD', 'devto_residency', true, '{"type": "Part-time residency"}'::jsonb)

ON CONFLICT (source_external_id) DO NOTHING;

-- Create a helper function to generate demo notifications for any user
CREATE OR REPLACE FUNCTION create_demo_notifications(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Welcome notification
  INSERT INTO notifications (user_id, type, title, body, link, payload) VALUES
  (target_user_id, 'system', 'Welcome to Orin!', 'Start by adding your first proof of work. Connect GitHub, upload certificates, or link your projects.', '/dashboard/sources/new', '{"event": "welcome"}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Tip notification
  INSERT INTO notifications (user_id, type, title, body, link, payload) VALUES
  (target_user_id, 'coach_tip', 'Pro tip: Add multiple sources', 'The more sources you connect, the better your AI career coach can help you. Try adding your GitHub profile first.', '/dashboard/sources/new', '{"event": "tip"}'::jsonb)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to generate a demo coach note
CREATE OR REPLACE FUNCTION create_demo_coach_note(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO coach_notes (user_id, type, content, action_label, action_url, priority) VALUES
  (target_user_id, 'ad_hoc', 'Welcome to Orin! I''m your AI career coach. I''ll help you build a strong portfolio of verified proof cards. Start by adding your GitHub projects, certificates, or any other achievements. The more proof you add, the better I can advise you on your career path.', 'Add your first source', '/dashboard/sources/new', 10)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a function to auto-create demo data for new users
CREATE OR REPLACE FUNCTION handle_new_user_demo_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create demo notifications
  PERFORM create_demo_notifications(NEW.id);

  -- Create demo coach note
  PERFORM create_demo_coach_note(NEW.id);

  -- Create demo proof cards
  INSERT INTO proof_cards (user_id, title, description, source_type, source_url, skills_extracted, skills_user_added, what_it_proves, verification_status, visibility, view_count, metadata) VALUES
  (NEW.id, 'Portfolio Website', 'Personal portfolio built with Next.js and Tailwind CSS', 'project', 'https://github.com/demo/portfolio', ARRAY['Next.js', 'Tailwind CSS', 'TypeScript', 'React'], ARRAY[], ARRAY['Frontend Development', 'UI/UX Design', 'Responsive Design'], 'verified', 'public', 42, '{"deploymentUrl": "https://portfolio.demo.com", "technologies": "Next.js, Tailwind CSS, TypeScript"}'::jsonb),
  (NEW.id, 'Machine Learning Certification', 'Completed Stanford CS229 Machine Learning course', 'certificate', 'https://coursera.org/verify/ml-cert', ARRAY['Machine Learning', 'Python', 'Linear Algebra', 'Statistics'], ARRAY[], ARRAY['Machine Learning', 'Statistical Analysis', 'Data Processing'], 'verified', 'public', 15, '{"issuer": "Stanford University", "issuedDate": "2026-01-15", "credentialId": "ML-2026-DEMO"}'::jsonb),
  (NEW.id, 'Open Source Contribution', 'Contributed to React ecosystem - accessibility improvements', 'github', 'https://github.com/facebook/react', ARRAY['React', 'JavaScript', 'Accessibility', 'Testing'], ARRAY[], ARRAY['Open Source Contribution', 'Code Review', 'Accessibility'], 'verified', 'public', 28, '{"language": "JavaScript", "stars": 200000, "pullRequests": 3}'::jsonb),
  (NEW.id, 'HackMIT Winner', 'First place at MIT annual hackathon - built climate data visualization tool', 'hackathon', 'https://devpost.com/software/climate-viz', ARRAY['Data Visualization', 'D3.js', 'Python', 'Flask'], ARRAY['Presentation', 'Teamwork'], ARRAY['Rapid Prototyping', 'Teamwork', 'Pitching', 'Full Stack Development'], 'verified', 'public', 56, '{"placement": "1st Place", "teamSize": 4, "prize": "$5,000"}'::jsonb),
  (NEW.id, 'Technical Blog: React Performance', 'Blog post about React performance optimization techniques', 'blog', 'https://dev.to/demo/react-performance', ARRAY['React', 'Performance', 'Web Vitals', 'JavaScript'], ARRAY[], ARRAY['Technical Writing', 'Knowledge Sharing', 'Frontend Optimization'], 'verified', 'public', 34, '{"readTime": "8 min", "publication": "Dev.to", "claps": 150}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Create demo sources
  INSERT INTO proof_sources (user_id, source_type, source_url, source_name, is_connected, metadata) VALUES
  (NEW.id, 'github', 'https://github.com/demo', 'GitHub Profile', true, '{"repos": 15, "contributions": 500}'::jsonb),
  (NEW.id, 'certificate', 'https://coursera.org/demo', 'Coursera Certificates', true, '{"certificates": 5}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Create demo subscription (free plan)
  INSERT INTO subscriptions (user_id, plan, status) VALUES
  (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;

  -- Create notification preferences
  INSERT INTO notification_preferences (user_id, weekly_summary, recruiter_views, verification_changes, opportunity_matches, coach_tips, product_updates) VALUES
  (NEW.id, true, true, false, true, false, true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_demo ON auth.users;

-- Create trigger for new users (if not exists)
CREATE TRIGGER on_auth_user_created_demo
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_demo_data();
