import * as core from '@actions/core';
import * as github from '@actions/github';
import moment from 'moment';
import { getPRCommits } from './get-pr-commits';

async function run() {
  try {
    const githubToken = core.getInput('githubToken');
    const octokit = github.getOctokit(githubToken);

    const commits = await getPRCommits(octokit, github.context.issue);
    await octokit.pulls.update({
      pull_number: github.context.issue.number,
      repo: github.context.issue.repo,
      owner: github.context.issue.owner,
      body: commits,
      ...(github.context.eventName === 'pull_request.opened'
        ? { title: `deploy(production): ${moment().format(`YYYY-MM-DD`)}` }
        : {}),
    });
  } catch (err) {
    // setFailed logs the message and sets a failing exit code
    core.setFailed(`Action failed with error ${err}`);
  }
}

run();
