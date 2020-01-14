import Permissions from '../permissions';

const userid = 'acct:flash@gord.on';

describe('permissions', function() {
  let fakeStore;
  let permissions;

  beforeEach(function() {
    fakeStore = {
      getDefault: sinon.stub().returns(null),
      setDefault: sinon.stub(),
    };
    permissions = new Permissions(fakeStore);
  });

  describe('#private', function() {
    it('only allows the user to read the annotation', function() {
      assert.deepEqual(permissions.private(userid), {
        read: [userid],
        update: [userid],
        delete: [userid],
      });
    });
  });

  describe('#shared', function() {
    it('allows the group to read the annotation', function() {
      assert.deepEqual(permissions.shared(userid, 'gid'), {
        read: ['group:gid'],
        update: [userid],
        delete: [userid],
      });
    });
  });

  describe('#default', function() {
    it('returns shared permissions by default', function() {
      assert.deepEqual(
        permissions.default(userid, 'gid'),
        permissions.shared(userid, 'gid')
      );
    });

    it('returns private permissions if the saved level is "private"', function() {
      fakeStore.getDefault.withArgs('annotationPrivacy').returns('private');
      assert.deepEqual(
        permissions.default(userid, 'gid'),
        permissions.private(userid)
      );
    });

    it('returns shared permissions if the saved level is "private" but no `userid`', function() {
      // FIXME: This test is necessary for the patch fix to prevent the "split-null" bug
      // https://github.com/hypothesis/client/issues/1221 but should be removed when the
      // code is refactored.
      fakeStore.getDefault.withArgs('annotationPrivacy').returns('private');
      assert.deepEqual(
        permissions.default(undefined, 'gid'),
        permissions.shared(undefined, 'gid')
      );
    });

    it('returns shared permissions if the saved level is "shared"', function() {
      fakeStore.getDefault.withArgs('annotationPrivacy').returns('shared');
      assert.deepEqual(
        permissions.default(userid, 'gid'),
        permissions.shared(userid, 'gid')
      );
    });
  });

  describe('#setDefault', function() {
    it('saves the default permissions in the store', function() {
      permissions.setDefault('private');
      assert.calledWith(fakeStore.setDefault, 'annotationPrivacy', 'private');
    });
  });

  describe('#isShared', function() {
    it('returns true if a group can read the annotation', function() {
      const perms = permissions.shared(userid, 'gid');
      assert.isTrue(permissions.isShared(perms));
    });

    it('returns false if only specific users can read the annotation', function() {
      const perms = permissions.private(userid);
      assert.isFalse(permissions.isShared(perms));
    });
  });

  describe('#permits', function() {
    it('returns true if the user can perform the action', function() {
      const perms = permissions.private(userid);
      assert.isTrue(permissions.permits(perms, 'update', userid));
      assert.isTrue(permissions.permits(perms, 'delete', userid));
    });

    it('returns false if the user cannot perform the action', function() {
      const perms = permissions.private('acct:not.flash@gord.on');
      assert.isFalse(permissions.permits(perms, 'update', userid));
      assert.isFalse(permissions.permits(perms, 'delete', userid));
    });
  });
});
