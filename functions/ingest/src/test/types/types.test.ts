import { IdentityMap, findIdentity } from '../../types';

test('findIdentity', () => {
  const identities: IdentityMap = new Map([
    [
      'id1',
      {
        accounts: [
          { feedId: 1, type: 'github', id: 'githubid1' },
          { feedId: 2, type: 'jira', id: 'jiraid1', name: 'jiraname1' },
        ],
      },
    ],
    [
      'id2',
      {
        accounts: [
          { feedId: 1, type: 'github', id: 'githubid2' },
          { feedId: 2, type: 'jira', name: 'jiraname2' },
        ],
      },
    ],
  ]);

  let found = findIdentity(identities, 1, 'githubid2');
  expect(found).toBeDefined();
  if (found) {
    const [foundId, foundIdentity] = found;
    expect(foundId).toEqual('id2');
    expect(foundIdentity.accounts[0].id).toEqual('githubid2');
  }

  found = findIdentity(identities, 2, 'jiraid2', 'jiraname2');
  expect(found).toBeDefined();
  if (found) {
    const [foundId, foundIdentity] = found;
    expect(foundId).toEqual('id2');
    expect(foundIdentity.accounts[1].name).toEqual('jiraname2');
  }

  found = findIdentity(identities, 2, 'githubid3');
  expect(found).toBeUndefined();
});
