const fs = require('fs');
const path = require('path');
const { getCurrentUser, requireUserScope } = require('./auth');
const { runStars } = require('./stars');
const { runRepos } = require('./repos');
const { generateProfile } = require('./profile');
const { generateDraft } = require('./drafts');
const { generateDraft: generateClassifyDraft, applyClassification, generateApplySummary } = require('./classify');
const { generateBeautifiedReadme } = require('./beautify');
const { generateI18n } = require('./i18n');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    command: null,
    user: null,
    output: null,
    refresh: false,
    repo: null,
    apply: false,
    plan: null,
    email: null,
    featuredSort: 'stars',
    theme: 'tokyonight',
    langs: null,
    fromFile: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--user' || arg === '-u') {
      options.user = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--refresh' || arg === '-r') {
      options.refresh = true;
    } else if (arg === '--repo') {
      options.repo = args[++i];
    } else if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--plan') {
      options.plan = args[++i];
    } else if (arg === '--email') {
      options.email = args[++i];
    } else if (arg === '--featured-sort') {
      options.featuredSort = args[++i];
    } else if (arg === '--theme') {
      options.theme = args[++i];
    } else if (arg === '--langs') {
      options.langs = args[++i];
    } else if (arg === '--from-file') {
      options.fromFile = args[++i];
    } else if (!options.command && !arg.startsWith('-')) {
      options.command = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
GitHub Asset Manager - organize your GitHub stars and repositories.

Usage: node scripts/github-asset-manager.js <command> [options]

Commands:
  stars       Analyze and report on GitHub starred repositories
  repos       Audit your own GitHub repositories
  profile     Generate a GitHub Profile README
  draft       Generate completion draft for a specific repository
  beautify    Beautify a repository README
  i18n        Generate multilingual READMEs and descriptions
  audit       Run both stars and repos analysis
  classify    Generate or apply GitHub Star Lists classification

Options:
  --user, -u <username>   Target GitHub user (default: current authenticated user)
  --output, -o <dir>      Write output to files in this directory instead of stdout
  --refresh, -r           Force refresh GitHub API cache
  --repo <owner/repo>     Required for draft, beautify, and i18n commands
  --from-file <path>      Read README from a local file for beautify/i18n
  --email <email>         Contact email for profile README
  --featured-sort <mode>  Sort featured projects by 'stars' or 'recent'
  --theme <theme>         Stats card theme (default: tokyonight)
  --langs <list>          Comma-separated language codes for i18n (default: en,zh)
  --apply                 Apply a classification plan (requires --plan)
  --plan <file>           Classification plan JSON file (use - for stdin)
  --help, -h              Show this help

Examples:
  node scripts/github-asset-manager.js stars
  node scripts/github-asset-manager.js repos --user octocat --refresh
  node scripts/github-asset-manager.js profile --output ./my-profile
  node scripts/github-asset-manager.js draft --repo owner/repo-name
  node scripts/github-asset-manager.js beautify --repo owner/repo-name
  node scripts/github-asset-manager.js beautify --repo owner/repo-name --from-file ./README.md
  node scripts/github-asset-manager.js i18n --repo owner/repo-name --langs en,zh,ja
  node scripts/github-asset-manager.js i18n --repo owner/repo-name --langs en,zh,ja --from-file ./README.md
  node scripts/github-asset-manager.js audit
  node scripts/github-asset-manager.js classify
  node scripts/github-asset-manager.js classify --apply --plan ./plan.json
`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(dir, filename, content) {
  ensureDir(dir);
  const filePath = path.resolve(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function emitOutput(content, outputDir, filename, label) {
  if (outputDir) {
    const filePath = writeFile(outputDir, filename, content);
    console.log(`${label} written to: ${filePath}`);
  } else {
    console.log(content);
  }
}

function readPlanFile(planPath) {
  let content;
  if (planPath === '-') {
    content = fs.readFileSync(0, 'utf8');
  } else {
    content = fs.readFileSync(path.resolve(planPath), 'utf8');
  }
  return JSON.parse(content);
}

async function main() {
  const options = parseArgs(process.argv);

  if (!options.command) {
    console.error('Error: No command provided.');
    printHelp();
    process.exit(1);
  }

  const currentUser = getCurrentUser();
  const targetUser = options.user || currentUser;

  if (!targetUser) {
    console.error('Error: Could not determine target GitHub user.');
    process.exit(1);
  }

  const outputDir = options.output ? path.resolve(options.output) : null;

  try {
    switch (options.command) {
      case 'stars': {
        const report = await runStars(targetUser, { refresh: options.refresh });
        emitOutput(report, outputDir, 'stars-report.md', 'Stars report');
        break;
      }

      case 'repos': {
        const report = await runRepos(targetUser, currentUser, { refresh: options.refresh });
        emitOutput(report, outputDir, 'repos-report.md', 'Repository audit');
        break;
      }

      case 'profile': {
        const profile = await generateProfile(targetUser, currentUser, {
          refresh: options.refresh,
          email: options.email,
          featuredSort: options.featuredSort,
          theme: options.theme,
        });
        emitOutput(profile, outputDir, 'profile-readme.md', 'Profile README');
        break;
      }

      case 'draft': {
        if (!options.repo) {
          console.error('Error: --repo is required for draft command.');
          process.exit(1);
        }
        const draft = await generateDraft(options.repo);
        if (outputDir) {
          const draftsDir = path.join(outputDir, 'repo-drafts');
          const safeName = options.repo.replace(/\//g, '-');
          const filePath = writeFile(draftsDir, `${safeName}.md`, draft);
          console.log(`Repository draft written to: ${filePath}`);
        } else {
          console.log(draft);
        }
        break;
      }

      case 'audit': {
        const starsReport = await runStars(targetUser, { refresh: options.refresh });
        const reposReport = await runRepos(targetUser, currentUser, { refresh: options.refresh });

        if (outputDir) {
          const starsPath = writeFile(outputDir, 'stars-report.md', starsReport);
          console.log(`Stars report written to: ${starsPath}`);
          const reposPath = writeFile(outputDir, 'repos-report.md', reposReport);
          console.log(`Repository audit written to: ${reposPath}`);
        } else {
          console.log(starsReport);
          console.log('\n---\n');
          console.log(reposReport);
        }
        break;
      }

      case 'classify': {
        if (options.apply) {
          if (!options.plan) {
            console.error('Error: --plan is required when using --apply.');
            process.exit(1);
          }
          requireUserScope();
          const plan = readPlanFile(options.plan);
          const result = await applyClassification(plan);
          const summary = generateApplySummary(result);
          emitOutput(summary, outputDir, 'classify-summary.md', 'Classification summary');
        } else {
          const draft = await generateClassifyDraft(targetUser, { refresh: options.refresh });
          emitOutput(draft, outputDir, 'classify-draft.md', 'Classification draft');
        }
        break;
      }

      case 'beautify': {
        if (!options.repo) {
          console.error('Error: --repo is required for beautify command.');
          process.exit(1);
        }
        const readme = await generateBeautifiedReadme(options.repo, { fromFile: options.fromFile });
        emitOutput(readme, outputDir, 'README-beautified.md', 'Beautified README');
        break;
      }

      case 'i18n': {
        if (!options.repo) {
          console.error('Error: --repo is required for i18n command.');
          process.exit(1);
        }
        const langs = options.langs ? options.langs.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        const result = await generateI18n(options.repo, { langs, fromFile: options.fromFile });
        if (outputDir) {
          for (const file of result.files) {
            writeFile(outputDir, file.filename, file.content);
          }
          emitOutput(result.summaryMarkdown, outputDir, 'i18n-summary.md', 'i18n summary');
        } else {
          console.log(result.summaryMarkdown);
          for (const file of result.files) {
            console.log(`\n--- ${file.filename} ---\n`);
            console.log(file.content);
          }
        }
        break;
      }

      default:
        console.error(`Error: Unknown command "${options.command}".`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  main,
};
