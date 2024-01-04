import { get, has, set, update } from 'lodash';
import github from '@actions/github';

export async function paginate(
  client: ReturnType<typeof github.getOctokit>,
  query: string,
  variables: any,
  paginatePath: string[],
) {
  const nodesPath = [...paginatePath, 'nodes'];
  const pageInfoPath = [...paginatePath, 'pageInfo'];
  const endCursorPath = [...pageInfoPath, 'endCursor'];
  const hasNextPagePath = [...pageInfoPath, 'hasNextPage'];
  const hasNextPage = (data) => get(data, hasNextPagePath);

  const data = await client.graphql(query, variables);

  if (!has(data, nodesPath)) {
    throw new Error(
      "Data doesn't contain `nodes` field. Make sure the `paginatePath` is set to the field you wish to paginate and that the query includes the `nodes` field.",
    );
  }

  if (!has(data, pageInfoPath) || !has(data, endCursorPath) || !has(data, hasNextPagePath)) {
    throw new Error(
      "Data doesn't contain `pageInfo` field with `endCursor` and `hasNextPage` fields. Make sure the `paginatePath` is set to the field you wish to paginate and that the query includes the `pageInfo` field.",
    );
  }

  while (hasNextPage(data)) {
    const newData = await client.graphql(query, {
      ...variables,
      after: get(data, [...pageInfoPath, 'endCursor']),
    });
    const newNodes = get(newData, nodesPath);
    const newPageInfo = get(newData, pageInfoPath);

    set(data as any, pageInfoPath, newPageInfo);
    update(data as any, nodesPath, (d) => d.concat(newNodes));
  }

  return data;
}
