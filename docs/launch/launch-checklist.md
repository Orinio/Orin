# Orin — Launch Checklist

## Pre-Launch (1-2 weeks before)

### Technical
- [ ] Run `npm run typecheck` in both packages — fix all errors
- [ ] Run `npm run lint` in frontend — fix all warnings
- [ ] Run `npm test` in both packages — all tests pass
- [ ] Run `npm run build` in both packages — builds succeed
- [ ] Verify onboarding flow works end-to-end (3 steps)
- [ ] Test public profile page SEO (OG tags, structured data)
- [ ] Test embeddable proof card page
- [ ] Test cold outreach script: `npx tsx scripts/cold-outreach.ts torvalds`

### Content
- [ ] Create Product Hunt assets (logo, screenshots, video)
- [ ] Write Product Hunt launch copy (see `docs/launch/product-hunt.md`)
- [ ] Write Hacker News post (see `docs/launch/hacker-news.md`)
- [ ] Write Reddit posts (see `docs/launch/reddit.md`)
- [ ] Write Twitter thread (see `docs/launch/twitter-thread.md`)
- [ ] Create OG image for social sharing

### Outreach
- [ ] Create outreach campaign: `npx tsx scripts/outreach-tracker.ts init launch-week`
- [ ] Add 50-100 target GitHub users to campaign
- [ ] Generate Proof Card previews for all targets
- [ ] Personalize email/LinkedIn messages
- [ ] Schedule outreach messages

---

## Launch Day

### Morning (8-10 AM EST)
- [ ] Post on Hacker News (Show HN)
- [ ] Post on r/SideProject
- [ ] Post on r/cscareerquestions
- [ ] Post on Twitter/X (thread)

### Midday (12-2 PM EST)
- [ ] Launch on Product Hunt
- [ ] Post first comment on Product Hunt
- [ ] Share on LinkedIn
- [ ] Send outreach emails (batch 1)

### Evening (5-7 PM EST)
- [ ] Respond to comments on all platforms
- [ ] Send follow-up messages to engaged users
- [ ] Post update on Twitter/X

---

## Post-Launch (1-2 weeks after)

### Engagement
- [ ] Respond to all comments within 24 hours
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Post daily updates on progress

### Outreach
- [ ] Send follow-up to non-responders
- [ ] Reach out to new targets
- [ ] Track conversion rates

### Content
- [ ] Write "What I learned launching Orin" post
- [ ] Create case studies from early users
- [ ] Document metrics and share publicly

---

## Metrics to Track

### Technical
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Error rate < 1%
- [ ] Uptime > 99%

### Growth
- [ ] Signups per day
- [ ] Activation rate (% who complete onboarding)
- [ ] Proof Cards created per user
- [ ] Public profile views
- [ ] Embed page views

### Engagement
- [ ] Daily active users
- [ ] Session duration
- [ ] Features used per session
- [ ] Return rate

### Outreach
- [ ] Emails sent
- [ ] Response rate
- [ ] Signup conversion rate
- [ ] Channel performance (email vs LinkedIn vs Twitter)

---

## Launch Day Checklist (Print & Use)

### 8:00 AM
- [ ] Coffee ready
- [ ] All posts scheduled
- [ ] Notifications enabled
- [ ] Monitoring dashboard open

### 8:30 AM
- [ ] Post on Hacker News
- [ ] Post on Reddit (r/SideProject)

### 9:00 AM
- [ ] Post on Reddit (r/cscareerquestions)
- [ ] Post on Twitter/X

### 10:00 AM
- [ ] Launch on Product Hunt
- [ ] Post first comment

### 11:00 AM - 5:00 PM
- [ ] Monitor all platforms
- [ ] Respond to comments
- [ ] Engage with community

### 5:00 PM
- [ ] Send outreach emails (batch 1)
- [ ] Post evening update

### 9:00 PM
- [ ] Review metrics
- [ ] Plan tomorrow's actions
- [ ] Celebrate 🎉
