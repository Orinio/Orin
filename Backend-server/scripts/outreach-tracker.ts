/**
 * Orin - Outreach Campaign Tracker
 * Simple CSV-based tracker for managing outreach campaigns.
 * 
 * Usage:
 *   npx tsx scripts/outreach-tracker.ts init <campaign-name>
 *   npx tsx scripts/outreach-tracker.ts add <campaign-name> <github-username> [--email <email>] [--status <status>]
 *   npx tsx scripts/outreach-tracker.ts list <campaign-name> [--status <status>]
 *   npx tsx scripts/outreach-tracker.ts update <campaign-name> <github-username> --status <new-status>
 *   npx tsx scripts/outreach-tracker.ts stats <campaign-name>
 *   npx tsx scripts/outreach-tracker.ts export <campaign-name> [--format csv|json]
 * 
 * Statuses: pending, contacted, responded, signed_up, converted
 */

import * as fs from 'fs';
import * as path from 'path';

const CAMPAIGNS_DIR = path.join(process.cwd(), 'outreach-campaigns');

interface OutreachEntry {
  username: string;
  email: string;
  status: 'pending' | 'contacted' | 'responded' | 'signed_up' | 'converted';
  addedAt: string;
  updatedAt: string;
  notes: string;
  channel: 'email' | 'linkedin' | 'twitter' | 'other';
}

interface Campaign {
  name: string;
  createdAt: string;
  entries: OutreachEntry[];
}

function getCampaignPath(name: string): string {
  return path.join(CAMPAIGNS_DIR, `${name}.json`);
}

function ensureCampaignsDir(): void {
  if (!fs.existsSync(CAMPAIGNS_DIR)) {
    fs.mkdirSync(CAMPAIGNS_DIR, { recursive: true });
  }
}

function loadCampaign(name: string): Campaign | null {
  const campaignPath = getCampaignPath(name);
  if (!fs.existsSync(campaignPath)) return null;

  const data = fs.readFileSync(campaignPath, 'utf-8');
  return JSON.parse(data) as Campaign;
}

function saveCampaign(campaign: Campaign): void {
  ensureCampaignsDir();
  const campaignPath = getCampaignPath(campaign.name);
  fs.writeFileSync(campaignPath, JSON.stringify(campaign, null, 2));
}

function initCampaign(name: string): void {
  if (loadCampaign(name)) {
    console.log(`Campaign "${name}" already exists.`);
    return;
  }

  const campaign: Campaign = {
    name,
    createdAt: new Date().toISOString(),
    entries: []
  };

  saveCampaign(campaign);
  console.log(`Created campaign: ${name}`);
  console.log(`Location: ${getCampaignPath(name)}`);
}

function addEntry(campaignName: string, username: string, options: { email?: string; status?: string; notes?: string; channel?: string }): void {
  const campaign = loadCampaign(campaignName);
  if (!campaign) {
    console.error(`Campaign "${campaignName}" not found. Run: npx tsx scripts/outreach-tracker.ts init ${campaignName}`);
    process.exit(1);
  }

  // Check for duplicates
  if (campaign.entries.some(e => e.username === username)) {
    console.log(`User @${username} already exists in campaign "${campaignName}".`);
    return;
  }

  const entry: OutreachEntry = {
    username,
    email: options.email || '',
    status: (options.status as OutreachEntry['status']) || 'pending',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: options.notes || '',
    channel: (options.channel as OutreachEntry['channel']) || 'email'
  };

  campaign.entries.push(entry);
  saveCampaign(campaign);
  console.log(`Added @${username} to campaign "${campaignName}" (status: ${entry.status})`);
}

function listEntries(campaignName: string, statusFilter?: string): void {
  const campaign = loadCampaign(campaignName);
  if (!campaign) {
    console.error(`Campaign "${campaignName}" not found.`);
    process.exit(1);
  }

  let entries = campaign.entries;
  if (statusFilter) {
    entries = entries.filter(e => e.status === statusFilter);
  }

  if (entries.length === 0) {
    console.log(`No entries${statusFilter ? ` with status "${statusFilter}"` : ''} in campaign "${campaignName}".`);
    return;
  }

  console.log(`\nCampaign: ${campaign.name}`);
  console.log(`Created: ${new Date(campaign.createdAt).toLocaleDateString()}`);
  console.log(`Entries: ${entries.length}${statusFilter ? ` (filtered by: ${statusFilter})` : ''}\n`);

  console.log('Username          | Status        | Channel   | Added');
  console.log('-'.repeat(65));

  for (const entry of entries) {
    const username = `@${entry.username}`.padEnd(17);
    const status = entry.status.padEnd(13);
    const channel = (entry.channel || 'email').padEnd(9);
    const added = new Date(entry.addedAt).toLocaleDateString();
    console.log(`${username} | ${status} | ${channel} | ${added}`);
  }
}

function updateStatus(campaignName: string, username: string, newStatus: string): void {
  const campaign = loadCampaign(campaignName);
  if (!campaign) {
    console.error(`Campaign "${campaignName}" not found.`);
    process.exit(1);
  }

  const entry = campaign.entries.find(e => e.username === username);
  if (!entry) {
    console.error(`User @${username} not found in campaign "${campaignName}".`);
    process.exit(1);
  }

  const validStatuses = ['pending', 'contacted', 'responded', 'signed_up', 'converted'];
  if (!validStatuses.includes(newStatus)) {
    console.error(`Invalid status: ${newStatus}. Valid statuses: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  entry.status = newStatus as OutreachEntry['status'];
  entry.updatedAt = new Date().toISOString();
  saveCampaign(campaign);
  console.log(`Updated @${username} status to "${newStatus}"`);
}

function showStats(campaignName: string): void {
  const campaign = loadCampaign(campaignName);
  if (!campaign) {
    console.error(`Campaign "${campaignName}" not found.`);
    process.exit(1);
  }

  const entries = campaign.entries;
  const total = entries.length;

  const statusCounts: Record<string, number> = {};
  const channelCounts: Record<string, number> = {};

  for (const entry of entries) {
    statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
    channelCounts[entry.channel] = (channelCounts[entry.channel] || 0) + 1;
  }

  console.log(`\nCampaign: ${campaign.name}`);
  console.log(`Created: ${new Date(campaign.createdAt).toLocaleDateString()}`);
  console.log(`\n--- Status Breakdown ---`);
  console.log(`Total: ${total}`);
  console.log(`Pending: ${statusCounts['pending'] || 0}`);
  console.log(`Contacted: ${statusCounts['contacted'] || 0}`);
  console.log(`Responded: ${statusCounts['responded'] || 0}`);
  console.log(`Signed Up: ${statusCounts['signed_up'] || 0}`);
  console.log(`Converted: ${statusCounts['converted'] || 0}`);

  const responseRate = total > 0 ? ((statusCounts['responded'] || 0) / total * 100).toFixed(1) : '0';
  const conversionRate = total > 0 ? ((statusCounts['converted'] || 0) / total * 100).toFixed(1) : '0';
  console.log(`\nResponse Rate: ${responseRate}%`);
  console.log(`Conversion Rate: ${conversionRate}%`);

  if (Object.keys(channelCounts).length > 0) {
    console.log(`\n--- Channel Breakdown ---`);
    for (const [channel, count] of Object.entries(channelCounts)) {
      console.log(`${channel}: ${count}`);
    }
  }
}

function exportCampaign(campaignName: string, format: string): void {
  const campaign = loadCampaign(campaignName);
  if (!campaign) {
    console.error(`Campaign "${campaignName}" not found.`);
    process.exit(1);
  }

  if (format === 'csv') {
    const headers = ['username', 'email', 'status', 'channel', 'addedAt', 'updatedAt', 'notes'];
    const rows = campaign.entries.map(e => [
      e.username,
      e.email,
      e.status,
      e.channel,
      e.addedAt,
      e.updatedAt,
      `"${e.notes.replace(/"/g, '""')}"`
    ].join(','));

    console.log([headers.join(','), ...rows].join('\n'));
  } else {
    console.log(JSON.stringify(campaign, null, 2));
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Orin Outreach Campaign Tracker

Usage:
  npx tsx scripts/outreach-tracker.ts init <campaign-name>
  npx tsx scripts/outreach-tracker.ts add <campaign-name> <username> [--email <email>] [--status <status>] [--channel <channel>] [--notes <notes>]
  npx tsx scripts/outreach-tracker.ts list <campaign-name> [--status <status>]
  npx tsx scripts/outreach-tracker.ts update <campaign-name> <username> --status <new-status>
  npx tsx scripts/outreach-tracker.ts stats <campaign-name>
  npx tsx scripts/outreach-tracker.ts export <campaign-name> [--format csv|json]

Statuses: pending, contacted, responded, signed_up, converted
Channels: email, linkedin, twitter, other

Examples:
  npx tsx scripts/outreach-tracker.ts init product-hunt-launch
  npx tsx scripts/outreach-tracker.ts add product-hunt-launch torvalds --email linus@torvalds.com --channel email
  npx tsx scripts/outreach-tracker.ts update product-hunt-launch torvalds --status contacted
  npx tsx scripts/outreach-tracker.ts stats product-hunt-launch
  npx tsx scripts/outreach-tracker.ts export product-hunt-launch --format csv
`);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'init': {
      const name = args[1];
      if (!name) {
        console.error('Campaign name required');
        process.exit(1);
      }
      initCampaign(name);
      break;
    }

    case 'add': {
      const campaignName = args[1];
      const username = args[2];
      if (!campaignName || !username) {
        console.error('Campaign name and username required');
        process.exit(1);
      }

      const options: { email?: string; status?: string; notes?: string; channel?: string } = {};
      const emailIndex = args.indexOf('--email');
      if (emailIndex !== -1) options.email = args[emailIndex + 1];
      const statusIndex = args.indexOf('--status');
      if (statusIndex !== -1) options.status = args[statusIndex + 1];
      const channelIndex = args.indexOf('--channel');
      if (channelIndex !== -1) options.channel = args[channelIndex + 1];
      const notesIndex = args.indexOf('--notes');
      if (notesIndex !== -1) options.notes = args[notesIndex + 1];

      addEntry(campaignName, username, options);
      break;
    }

    case 'list': {
      const campaignName = args[1];
      if (!campaignName) {
        console.error('Campaign name required');
        process.exit(1);
      }

      let statusFilter: string | undefined;
      const statusIndex = args.indexOf('--status');
      if (statusIndex !== -1) statusFilter = args[statusIndex + 1];

      listEntries(campaignName, statusFilter);
      break;
    }

    case 'update': {
      const campaignName = args[1];
      const username = args[2];
      const statusIndex = args.indexOf('--status');
      const newStatus = statusIndex !== -1 ? args[statusIndex + 1] : undefined;

      if (!campaignName || !username || !newStatus) {
        console.error('Campaign name, username, and --status required');
        process.exit(1);
      }

      updateStatus(campaignName, username, newStatus);
      break;
    }

    case 'stats': {
      const campaignName = args[1];
      if (!campaignName) {
        console.error('Campaign name required');
        process.exit(1);
      }
      showStats(campaignName);
      break;
    }

    case 'export': {
      const campaignName = args[1];
      if (!campaignName) {
        console.error('Campaign name required');
        process.exit(1);
      }

      let format = 'json';
      const formatIndex = args.indexOf('--format');
      if (formatIndex !== -1) format = args[formatIndex + 1];

      exportCampaign(campaignName, format);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run with --help for usage information');
      process.exit(1);
  }
}

main();
