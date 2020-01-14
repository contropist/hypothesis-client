//const STORAGE_KEY = 'hypothesis.privacy';

/**
 * Object defining which principals can read, update and delete an annotation.
 *
 * This is the same as the `permissions` field retrieved on an annotation via
 * the API.
 *
 * Principals are strings of the form `type:id` where `type` is `'acct'` (for a
 * specific user) or `'group'` (for a group).
 *
 * @typedef Permissions
 * @property {string[]} read - List of principals that can read the annotation
 * @property {string[]} update - List of principals that can edit the annotation
 * @property {string[]} delete - List of principals that can delete the
 * annotation
 */

/**
 * A service for generating and querying `Permissions` objects for annotations.
 *
 * It also provides methods to save and restore permissions preferences for new
 * annotations to local storage.
 */
// @ngInject
export default function Permissions(store) {
  const self = this;

  function defaultLevel() {
    const savedLevel = store.getDefault('annotationPrivacy');
    switch (savedLevel) {
      case 'private':
      case 'shared':
        return savedLevel;
      default:
        return 'shared';
    }
  }

  /**
   * Return the permissions for a private annotation.
   *
   * A private annotation is one which is readable only by its author.
   *
   * @param {string} userid - User ID of the author
   * @return {Permissions}
   */
  this.private = function(userid) {
    return {
      read: [userid],
      update: [userid],
      delete: [userid],
    };
  };

  /**
   * Return the permissions for an annotation that is shared with the given
   * group.
   *
   * @param {string} userid - User ID of the author
   * @param {string} groupId - ID of the group the annotation is being
   * shared with
   * @return {Permissions}
   */
  this.shared = function(userid, groupId) {
    return Object.assign(self.private(userid), {
      read: ['group:' + groupId],
    });
  };

  /**
   * Return the default permissions for an annotation in a given group.
   *
   * @param {string} userid - User ID of the author
   * @param {string} groupId - ID of the group the annotation is being shared
   * with
   * @return {Permissions}
   */
  this.default = function(userid, groupId) {
    // FIXME: The `&& userid` guard was put in place to protect against
    // https://github.com/hypothesis/client/issues/1221 for the short term
    // It prevents the setting of permissions to a private level, which
    // will throw Errors if no `userid` is available (i.e. the annotation was
    // just created by an anonymous user). Translation: default permissions for
    // a newly-created (but not saved-to-server) annotation created by a
    // non-authenticated (anonymous) user will always be shared. For now.
    if (defaultLevel() === 'private' && userid) {
      return self.private(userid);
    } else {
      return self.shared(userid, groupId);
    }
  };

  /**
   * Set the default permissions for new annotations.
   *
   * @param {'private'|'shared'} level
   */
  this.setDefault = function(level) {
    store.setDefault('annotationPrivacy', level);
  };

  /**
   * Return true if an annotation with the given permissions is shared with any
   * group.
   *
   * @param {Permissions} perms
   * @return {boolean}
   */
  this.isShared = function(perms) {
    return perms.read.some(function(principal) {
      return principal.indexOf('group:') === 0;
    });
  };

  /**
   * Return true if a user can perform the given `action` on an annotation.
   *
   * @param {Permissions} perms
   * @param {'update'|'delete'} action
   * @param {string} userid
   * @return {boolean}
   */
  this.permits = function(perms, action, userid) {
    return perms[action].indexOf(userid) !== -1;
  };
}
