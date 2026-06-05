-- Seed realistic opportunities for the Orin platform
-- Run this after the base schema is applied

INSERT INTO public.opportunities (title, company, type, required_skills, nice_to_have, description, location, is_remote, link, apply_deadline, salary_min, salary_max, salary_currency, source, is_active, posted_at) VALUES

-- Tech Internships
('Software Engineering Intern', 'Google', 'internship', 
 ARRAY['Python', 'Java', 'Data Structures', 'Algorithms', 'Git'],
 ARRAY['Machine Learning', 'Cloud Computing', 'Distributed Systems'],
 'Join Google as a Software Engineering Intern. Work on real projects that impact millions of users. Gain hands-on experience with cutting-edge technology.',
 'Mountain View, CA', false, 'https://careers.google.com/jobs/results/1234567890/',
 NOW() + INTERVAL '30 days', 8000, 12000, 'USD', 'google', true, NOW() - INTERVAL '7 days'),

('Frontend Engineer Intern', 'Meta', 'internship',
 ARRAY['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'GraphQL'],
 ARRAY['React Native', 'Performance Optimization', 'A/B Testing'],
 'Build the next generation of social experiences at Meta. Work with React and GraphQL on products used by billions.',
 'Menlo Park, CA', false, 'https://careers.meta.com/jobs/1234567890/',
 NOW() + INTERVAL '45 days', 9000, 13000, 'USD', 'meta', true, NOW() - INTERVAL '5 days'),

('Data Science Intern', 'Netflix', 'internship',
 ARRAY['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
 ARRAY['Spark', 'A/B Testing', 'Recommendation Systems'],
 'Join Netflix data science team to work on recommendation algorithms and content optimization.',
 'Los Gatos, CA', true, 'https://jobs.netflix.com/1234567890',
 NOW() + INTERVAL '60 days', 7500, 11000, 'USD', 'netflix', true, NOW() - INTERVAL '3 days'),

('Cloud Engineering Intern', 'Amazon Web Services', 'internship',
 ARRAY['AWS', 'Linux', 'Networking', 'Python', 'Terraform'],
 ARRAY['Kubernetes', 'Docker', 'CI/CD'],
 'Build and scale cloud infrastructure at AWS. Work with the latest cloud technologies.',
 'Seattle, WA', false, 'https://amazon.jobs/1234567890',
 NOW() + INTERVAL '30 days', 8500, 12500, 'USD', 'amazon', true, NOW() - INTERVAL '10 days'),

-- Full-time Jobs
('Junior Full Stack Developer', 'Stripe', 'job',
 ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Git'],
 ARRAY['Ruby', 'GraphQL', 'Payment Systems', 'Stripe API'],
 'Join Stripe to build economic infrastructure for the internet. Work on payment systems used by millions of businesses.',
 'San Francisco, CA', true, 'https://stripe.com/jobs/1234567890',
 NOW() + INTERVAL '30 days', 90000, 130000, 'USD', 'stripe', true, NOW() - INTERVAL '14 days'),

('Backend Engineer', 'Shopify', 'job',
 ARRAY['Ruby on Rails', 'PostgreSQL', 'Redis', 'Docker', 'Git'],
 ARRAY['GraphQL', 'Kubernetes', 'Microservices'],
 'Build the platform that powers millions of businesses worldwide.',
 'Toronto, Canada', true, 'https://shopify.com/careers/1234567890',
 NOW() + INTERVAL '45 days', 85000, 120000, 'USD', 'shopify', true, NOW() - INTERVAL '21 days'),

('ML Engineer', 'OpenAI', 'job',
 ARRAY['Python', 'Machine Learning', 'PyTorch', 'Transformers', 'CUDA'],
 ARRAY['Reinforcement Learning', 'Distributed Training', 'NLP'],
 'Work on cutting-edge AI models at OpenAI. Help shape the future of artificial intelligence.',
 'San Francisco, CA', false, 'https://openai.com/careers/1234567890',
 NOW() + INTERVAL '60 days', 150000, 250000, 'USD', 'openai', true, NOW() - INTERVAL '2 days'),

('DevOps Engineer', 'GitLab', 'job',
 ARRAY['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Git'],
 ARRAY['Terraform', 'AWS', 'GitLab CI'],
 'Help build the most comprehensive DevOps platform from source code to monitoring.',
 'Remote', true, 'https://gitlab.com/careers/1234567890',
 NOW() + INTERVAL '30 days', 95000, 140000, 'USD', 'gitlab', true, NOW() - INTERVAL '8 days'),

-- Scholarships
('Women in Tech Scholarship', 'Microsoft', 'scholarship',
 ARRAY['Computer Science', 'Engineering', 'STEM'],
 ARRAY['Leadership', 'Community Service'],
 '$10,000 scholarship for women pursuing computer science degrees. Includes mentorship from Microsoft engineers.',
 'Global', true, 'https://microsoft.com/scholarships/1234567890',
 NOW() + INTERVAL '90 days', NULL, NULL, 'USD', 'microsoft', true, NOW() - INTERVAL '30 days'),

('Diversity in AI Scholarship', 'Google', 'scholarship',
 ARRAY['Machine Learning', 'AI', 'Computer Science'],
 ARRAY['Research Experience', 'Publications'],
 'Supporting underrepresented students in AI research. $15,000 award plus Google mentorship.',
 'Global', true, 'https://research.google/scholarships/1234567890',
 NOW() + INTERVAL '60 days', NULL, NULL, 'USD', 'google', true, NOW() - INTERVAL '45 days'),

('Computer Science Scholarship', 'Apple', 'scholarship',
 ARRAY['Computer Science', 'Software Engineering', 'iOS Development'],
 ARRAY['Swift', 'UIKit', 'App Store'],
 'Supporting the next generation of app developers. $10,000 scholarship plus Apple hardware.',
 'Global', true, 'https://apple.com/education/scholarships/1234567890',
 NOW() + INTERVAL '45 days', NULL, NULL, 'USD', 'apple', true, NOW() - INTERVAL '20 days'),

-- Mentorship Programs
('Engineering Mentorship Program', 'Thoughtworks', 'mentorship',
 ARRAY['Software Engineering', 'Agile', 'Pair Programming'],
 ARRAY['Architecture', 'System Design'],
 '12-week mentorship with senior Thoughtworks engineers. Learn industry best practices.',
 'Remote', true, 'https://thoughtworks.com/mentorship/1234567890',
 NOW() + INTERVAL '30 days', NULL, NULL, 'USD', 'thoughtworks', true, NOW() - INTERVAL '15 days'),

('Startup Mentorship Track', 'Y Combinator', 'mentorship',
 ARRAY['Entrepreneurship', 'Product Development', 'Fundraising'],
 ARRAY['Technical Leadership', 'Team Building'],
 'Get paired with successful founders and YC partners. Perfect for aspiring entrepreneurs.',
 'Remote', true, 'https://ycombinator.com/mentorship/1234567890',
 NOW() + INTERVAL '60 days', NULL, NULL, 'USD', 'ycombinator', true, NOW() - INTERVAL '7 days'),

-- Hackathons
('AI Innovation Hackathon', 'HackMIT', 'hackathon',
 ARRAY['Machine Learning', 'Python', 'Data Science', 'API Integration'],
 ARRAY['NLP', 'Computer Vision', 'Reinforcement Learning'],
 '48-hour hackathon focused on AI solutions for real-world problems. $50,000 in prizes.',
 'Cambridge, MA', false, 'https://hackmit.org/2026',
 NOW() + INTERVAL '30 days', NULL, NULL, 'USD', 'hackmit', true, NOW() - INTERVAL '10 days'),

('Climate Tech Hackathon', 'ClimateTech', 'hackathon',
 ARRAY['JavaScript', 'React', 'Node.js', 'Data Visualization'],
 ARRAY['GIS', 'Environmental Science', 'IoT'],
 'Build technology solutions for climate change. $25,000 in prizes plus incubation opportunity.',
 'San Francisco, CA', false, 'https://climatetech.dev/hackathon/2026',
 NOW() + INTERVAL '45 days', NULL, NULL, 'USD', 'climatetech', true, NOW() - INTERVAL '5 days'),

('Healthcare Innovation Hackathon', 'HealthTech', 'hackathon',
 ARRAY['Python', 'Machine Learning', 'Data Analysis', 'Web Development'],
 ARRAY['HIPAA Compliance', 'FHIR', 'Healthcare APIs'],
 'Create solutions to improve healthcare accessibility. $30,000 in prizes.',
 'Boston, MA', false, 'https://healthtech.dev/hackathon/2026',
 NOW() + INTERVAL '60 days', NULL, NULL, 'USD', 'healthtech', true, NOW() - INTERVAL '3 days'),

-- Research Opportunities
('Machine Learning Research Intern', 'DeepMind', 'research',
 ARRAY['Machine Learning', 'Python', 'PyTorch', 'Research Methods'],
 ARRAY['Reinforcement Learning', 'Neuroscience', 'Publications'],
 'Join DeepMind research team to work on fundamental AI research problems.',
 'London, UK', false, 'https://deepmind.com/research/1234567890',
 NOW() + INTERVAL '90 days', 4000, 6000, 'GBP', 'deepmind', true, NOW() - INTERVAL '14 days'),

('Quantum Computing Research', 'IBM Research', 'research',
 ARRAY['Quantum Computing', 'Linear Algebra', 'Python', 'Qiskit'],
 ARRAY['Physics', 'Mathematics', 'Algorithms'],
 'Research internship in quantum computing at IBM Research. Work on quantum algorithms.',
 'Yorktown Heights, NY', false, 'https://research.ibm.com/1234567890',
 NOW() + INTERVAL '60 days', 5000, 7000, 'USD', 'ibm', true, NOW() - INTERVAL '21 days'),

('NLP Research Fellowship', 'Allen Institute for AI', 'research',
 ARRAY['Natural Language Processing', 'Python', 'Transformers', 'Machine Learning'],
 ARRAY['Linguistics', 'Knowledge Graphs', 'Semantic Parsing'],
 'Work on cutting-edge NLP research with world-class researchers.',
 'Seattle, WA', false, 'https://allenai.org/1234567890',
 NOW() + INTERVAL '45 days', 4500, 6500, 'USD', 'allenai', true, NOW() - INTERVAL '10 days'),

-- More internships for variety
('Mobile Developer Intern', 'Uber', 'internship',
 ARRAY['React Native', 'TypeScript', 'JavaScript', 'Mobile Development'],
 ARRAY['iOS', 'Android', 'GraphQL'],
 'Build mobile features used by millions of riders and drivers worldwide.',
 'San Francisco, CA', false, 'https://uber.com/careers/1234567890',
 NOW() + INTERVAL '30 days', 8000, 12000, 'USD', 'uber', true, NOW() - INTERVAL '12 days'),

('Cybersecurity Intern', 'CrowdStrike', 'internship',
 ARRAY['Cybersecurity', 'Networking', 'Linux', 'Python', 'SIEM'],
 ARRAY['Threat Intelligence', 'Incident Response', 'Malware Analysis'],
 'Join CrowdStrike security team to protect enterprises from cyber threats.',
 'Austin, TX', true, 'https://crowdstrike.com/careers/1234567890',
 NOW() + INTERVAL '45 days', 7000, 10000, 'USD', 'crowdstrike', true, NOW() - INTERVAL '8 days'),

('Data Engineering Intern', 'Airbnb', 'internship',
 ARRAY['SQL', 'Python', 'Spark', 'Data Modeling', 'ETL'],
 ARRAY['Airflow', 'dbt', 'Snowflake'],
 'Build data infrastructure that powers Airbnb business decisions.',
 'San Francisco, CA', true, 'https://airbnb.com/careers/1234567890',
 NOW() + INTERVAL '60 days', 8500, 12000, 'USD', 'airbnb', true, NOW() - INTERVAL '6 days'),

-- Jobs for early career
('Junior Data Analyst', 'Spotify', 'job',
 ARRAY['SQL', 'Python', 'Data Visualization', 'Statistics', 'Excel'],
 ARRAY['Tableau', 'R', 'Machine Learning'],
 'Analyze user behavior to improve music recommendations and user experience.',
 'Stockholm, Sweden', true, 'https://spotify.com/careers/1234567890',
 NOW() + INTERVAL '30 days', 60000, 80000, 'USD', 'spotify', true, NOW() - INTERVAL '18 days'),

('Associate Product Manager', 'Notion', 'job',
 ARRAY['Product Management', 'User Research', 'SQL', 'Analytics'],
 ARRAY['Design Thinking', 'Technical Background', 'Content Strategy'],
 'Help shape the future of productivity tools at Notion.',
 'San Francisco, CA', true, 'https://notion.so/careers/1234567890',
 NOW() + INTERVAL '45 days', 100000, 140000, 'USD', 'notion', true, NOW() - INTERVAL '9 days'),

('Junior DevOps Engineer', 'HashiCorp', 'job',
 ARRAY['Terraform', 'Docker', 'Kubernetes', 'Linux', 'CI/CD'],
 ARRAY['AWS', 'GCP', 'Azure', 'Vault'],
 'Help enterprises adopt infrastructure as code and cloud automation.',
 'Remote', true, 'https://hashicorp.com/careers/1234567890',
 NOW() + INTERVAL '30 days', 90000, 120000, 'USD', 'hashicorp', true, NOW() - INTERVAL '4 days');
