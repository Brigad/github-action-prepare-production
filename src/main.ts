import core from '@actions/core';
import github from '@actions/github';
import moment from 'moment';
import { getPRCommits } from './get-pr-commits';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  throw new Error(
    "GitHub's GraphQL API requires a token. Please pass a valid token (GITHUB_TOKEN) as an env variable, no scopes are required.",
  );
}

async function run() {
  try {
    const octokit = github.getOctokit(GITHUB_TOKEN!);

    const commits = await getPRCommits(octokit, github.context.issue);
    const pull = await octokit.rest.pulls.get({
      pull_number: github.context.issue.number,
      repo: github.context.issue.repo,
      owner: github.context.issue.owner,
    });
    await octokit.rest.pulls.update({
      pull_number: github.context.issue.number,
      repo: github.context.issue.repo,
      owner: github.context.issue.owner,
      body: commits,
      ...(pull.data.title.includes('deploy(production)')
        ? {}
        : { title: `deploy(production): ${moment().format(`YYYY-MM-DD HH:mm`)}` }),
    });
  } catch (err) {
    // setFailed logs the message and sets a failing exit code
    core.setFailed(`Action failed with error ${err}`);
  }
}

run();
