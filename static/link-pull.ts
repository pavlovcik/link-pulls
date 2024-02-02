import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { Octokit } from "@octokit/rest";
type GitHubIssueEvent = RestEndpointMethodTypes["issues"]["listEvents"]["response"]["data"][0];

const octokit = new Octokit(); // { auth: `YOUR_GITHUB_APP_PRIVATE_KEY` }

async function fetchEvents(owner: string, repo: string, issueOrPrNumber: number): Promise<GitHubIssueEvent[]> {
  try {
    const response = await octokit.rest.issues.listEvents({
      owner,
      repo,
      issue_number: issueOrPrNumber,
    });
    return response.data as GitHubIssueEvent[];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function checkLinked(owner: string, repo: string, issueNumber: number, pullRequestNumber: number) {
  const issueEvents = await fetchEvents(owner, repo, issueNumber);
  const prEvents = await fetchEvents(owner, repo, pullRequestNumber);

  // Track connections and disconnections
  const connections = new Map<number, GitHubIssueEvent>(); // Use issue/pr number as key for easy access

  issueEvents.forEach((issueEvent) => {
    if (issueEvent.event === "connected" || issueEvent.event === "cross-referenced") {
      prEvents.forEach((prEvent) => {
        if ((prEvent.event === "connected" || prEvent.event === "cross-referenced") && prEvent.created_at === issueEvent.created_at) {
          connections.set(issueNumber, issueEvent);
        }
      });
    } else if (issueEvent.event === "disconnected") {
      connections.delete(issueNumber); // Invalidate connection if disconnected
    }
  });

  return connections.size > 0;
}

void (async function main() {
  try {
    const isLinked = await checkLinked("ubiquibot", "production", 77, 78);
    console.trace({ isLinked });
  } catch (error) {
    console.error(error);
  }
})();
