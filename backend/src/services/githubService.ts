import db from '../db';

export const githubService = {
  async getLatestCommitSha(owner: string, repo: string): Promise<string> {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/HEAD`,
      {
        headers: {
          Accept: 'application/vnd.github.sha', // returns plain SHA, no JSON parse needed
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.text();
  }
};