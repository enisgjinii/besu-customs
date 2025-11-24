import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get current commit hash
    const { stdout: hash } = await execAsync("git rev-parse --short HEAD");
    const commitHash = hash.trim();

    // Get commit message
    const { stdout: message } = await execAsync('git log -1 --pretty=%B');
    const commitMessage = message.trim();

    // Get commit date
    const { stdout: date } = await execAsync('git log -1 --pretty=%ci');
    const commitDate = date.trim();

    // Get branch name
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
    const branchName = branch.trim();

    // Get remote URL to construct GitHub link
    let githubUrl = null;
    try {
      const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url');
      const url = remoteUrl.trim();
      
      // Parse GitHub URL (handles both HTTPS and SSH formats)
      let match = url.match(/github\.com[:/](.+?)\.git$/);
      if (!match) {
        match = url.match(/github\.com[:/](.+?)$/);
      }
      
      if (match) {
        const repo = match[1];
        githubUrl = `https://github.com/${repo}/commit/${commitHash}`;
      }
    } catch (error) {
      console.error("Could not get remote URL:", error);
    }

    return NextResponse.json({
      hash: commitHash,
      message: commitMessage,
      date: commitDate,
      branch: branchName,
      githubUrl,
    });
  } catch (error) {
    console.error("Git command error:", error);
    return NextResponse.json(
      {
        hash: "unknown",
        message: "Not available",
        date: "N/A",
        branch: "N/A",
        githubUrl: null,
      },
      { status: 500 }
    );
  }
}
