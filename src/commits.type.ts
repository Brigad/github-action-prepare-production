export interface User {
  login: string;
}

export interface Author {
  user: User;
}

export interface LabelsNode {
  name: string;
}

export interface Labels {
  nodes: LabelsNode[];
}

export interface AssociatedPullRequestsNode {
  author: User;
  number: number;
  title: string;
  labels: Labels;
}

export interface AssociatedPullRequests {
  nodes: AssociatedPullRequestsNode[];
}

export interface Commit {
  url: string;
  messageHeadline: string;
  author: Author;
  associatedPullRequests: AssociatedPullRequests;
}

export interface CommitsNode {
  commit: Commit;
}

export interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export interface CommitsClass {
  pageInfo: PageInfo;
  nodes: CommitsNode[];
}

export interface PullRequest {
  commits: CommitsClass;
}

export interface Repository {
  pullRequest: PullRequest;
}

export interface CommitsResult {
  repository: Repository;
}
