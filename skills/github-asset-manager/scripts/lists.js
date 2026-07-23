const { graphql } = require('./api');

const GET_LISTS_QUERY = `
  query GetLists {
    viewer {
      lists(first: 100) {
        nodes {
          id
          name
          description
          items(first: 100) {
            nodes {
              ... on Repository {
                id
                nameWithOwner
              }
            }
          }
        }
      }
    }
  }
`;

const GET_REPO_ID_QUERY = `
  query GetRepoId($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      nameWithOwner
    }
  }
`;

const CREATE_LIST_MUTATION = `
  mutation CreateList($name: String!, $description: String) {
    createUserList(input: { name: $name, description: $description, isPrivate: false }) {
      list {
        id
        name
        description
      }
    }
  }
`;

const UPDATE_LIST_MUTATION = `
  mutation UpdateList($listId: ID!, $name: String!, $description: String) {
    updateUserList(input: { listId: $listId, name: $name, description: $description }) {
      list {
        id
        name
        description
      }
    }
  }
`;

const DELETE_LIST_MUTATION = `
  mutation DeleteList($listId: ID!) {
    deleteUserList(input: { listId: $listId }) {
      user {
        login
      }
    }
  }
`;

const SET_REPO_LISTS_MUTATION = `
  mutation SetRepoLists($itemId: ID!, $listIds: [ID!]!) {
    updateUserListsForItem(input: { itemId: $itemId, listIds: $listIds }) {
      item {
        ... on Repository {
          nameWithOwner
        }
      }
    }
  }
`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLists() {
  const data = await graphql(GET_LISTS_QUERY);
  return data.data.viewer.lists.nodes.map(list => ({
    id: list.id,
    name: list.name,
    description: list.description,
    repos: list.items.nodes
      .filter(item => item && item.nameWithOwner)
      .map(item => item.nameWithOwner),
  }));
}

async function getRepoNodeId(owner, name) {
  const data = await graphql(GET_REPO_ID_QUERY, { owner, name });
  if (!data.data.repository) {
    throw new Error(`Repository ${owner}/${name} not found`);
  }
  return data.data.repository.id;
}

async function createList(name, description = '') {
  const data = await graphql(CREATE_LIST_MUTATION, { name, description });
  return data.data.createUserList.list;
}

async function updateList(listId, name, description = '') {
  const data = await graphql(UPDATE_LIST_MUTATION, { listId, name, description });
  return data.data.updateUserList.list;
}

async function deleteList(listId) {
  await graphql(DELETE_LIST_MUTATION, { listId });
}

async function setRepoLists(repoFullName, listIds) {
  const [owner, name] = repoFullName.split('/');
  if (!owner || !name) {
    throw new Error(`Invalid repository format: ${repoFullName}`);
  }

  const itemId = await getRepoNodeId(owner, name);
  await graphql(SET_REPO_LISTS_MUTATION, { itemId, listIds });
}

async function setRepoListsWithDelay(repoFullName, listIds, delayMs = 200) {
  const result = await setRepoLists(repoFullName, listIds);
  await sleep(delayMs);
  return result;
}

module.exports = {
  getLists,
  getRepoNodeId,
  createList,
  updateList,
  deleteList,
  setRepoLists,
  setRepoListsWithDelay,
};
