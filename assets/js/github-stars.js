document.addEventListener('DOMContentLoaded', function () {
  var starElements = Array.prototype.slice.call(document.querySelectorAll('[data-github-repo]'));
  var cardElements = Array.prototype.slice.call(document.querySelectorAll('[data-github-card]'));
  var userElements = Array.prototype.slice.call(document.querySelectorAll('[data-github-user]'));

  if (!starElements.length && !cardElements.length && !userElements.length) {
    return;
  }

  var repos = [];
  var repoCardMap = {};
  var users = [];
  var userMap = {};

  function ensureRepo(repo) {
    if (repo && repos.indexOf(repo) === -1) {
      repos.push(repo);
    }
  }

  starElements.forEach(function (element) {
    ensureRepo(element.getAttribute('data-github-repo'));
  });

  cardElements.forEach(function (element) {
    var repo = element.getAttribute('data-github-card');
    ensureRepo(repo);

    if (!repo) {
      return;
    }

    if (!repoCardMap[repo]) {
      repoCardMap[repo] = [];
    }
    repoCardMap[repo].push(element);
  });

  userElements.forEach(function (element) {
    var username = element.getAttribute('data-github-user');
    if (!username) {
      return;
    }

    if (users.indexOf(username) === -1) {
      users.push(username);
    }

    if (!userMap[username]) {
      userMap[username] = [];
    }
    userMap[username].push(element);
  });

  var displayMap = {};

  if (repos.length) {
    starElements.forEach(function (element) {
      var repo = element.getAttribute('data-github-repo');
      if (!repo) {
        return;
      }

      if (element.getAttribute('data-star-display') === 'text') {
        if (!displayMap[repo]) {
          displayMap[repo] = [];
        }
        displayMap[repo].push(element);
        element.textContent = '...';
      }
    });
  }

  var totalTargets = Array.prototype.slice.call(document.querySelectorAll('[data-stars-total]'));
  if (totalTargets.length) {
    totalTargets.forEach(function (target) {
      target.textContent = '...';
    });
  }

  function formatDate(isoString) {
    if (!isoString) {
      return null;
    }

    var date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  var requests = repos.map(function (repo) {
    return fetch('https://api.github.com/repos/' + repo)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('GitHub request failed');
        }
        return response.json();
      })
      .then(function (data) {
        return {
          repo: repo,
          stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : null,
          forks: typeof data.forks_count === 'number' ? data.forks_count : null,
          language: data.language || null,
          description: data.description || null,
          updated: formatDate(data.pushed_at)
        };
      })
      .catch(function () {
        return {
          repo: repo,
          stars: null,
          forks: null,
          language: null,
          description: null,
          updated: null
        };
      });
  });

  var repoPromise = Promise.all(requests).then(function (results) {
    var total = 0;
    var hasValidTotal = false;

    results.forEach(function (result) {
      var stars = result.stars;
      var valueText;

      if (typeof stars === 'number') {
        valueText = stars.toLocaleString();
        total += stars;
        hasValidTotal = true;
      } else {
        valueText = 'N/A';
      }

      var elements = displayMap[result.repo] || [];
      elements.forEach(function (element) {
        element.textContent = valueText;
      });

      var cards = repoCardMap[result.repo] || [];
      cards.forEach(function (card) {
        var descriptionEl = card.querySelector('[data-repo-description]');
        if (descriptionEl) {
          descriptionEl.textContent = result.description ? result.description : 'No description provided.';
        }

        var languageEl = card.querySelector('[data-repo-language]');
        if (languageEl) {
          if (result.language) {
            languageEl.textContent = result.language;
            languageEl.style.display = '';
          } else {
            languageEl.textContent = '';
            languageEl.style.display = 'none';
          }
        }

        var forksEl = card.querySelector('[data-repo-forks]');
        if (forksEl) {
          forksEl.textContent = typeof result.forks === 'number' ? result.forks.toLocaleString() : 'N/A';
        }

        var updatedWrapper = card.querySelector('[data-repo-updated-wrapper]');
        var updatedEl = card.querySelector('[data-repo-updated]');
        if (updatedWrapper && updatedEl) {
          if (result.updated) {
            updatedWrapper.style.display = '';
            updatedEl.textContent = result.updated;
          } else {
            updatedWrapper.style.display = 'none';
          }
        }
      });
      });

    if (totalTargets.length) {
      var totalText = hasValidTotal ? total.toLocaleString() : 'N/A';
      totalTargets.forEach(function (target) {
        target.textContent = totalText;
      });
    }
  });

  var userRequests = users.map(function (username) {
    return fetch('https://api.github.com/users/' + username)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('GitHub request failed');
        }
        return response.json();
      })
      .then(function (data) {
        return {
          username: username,
          avatar: data.avatar_url || null,
          bio: data.bio || null,
          followers: typeof data.followers === 'number' ? data.followers : null,
          following: typeof data.following === 'number' ? data.following : null,
          repos: typeof data.public_repos === 'number' ? data.public_repos : null,
          location: data.location || null
        };
      })
      .catch(function () {
        return {
          username: username,
          avatar: null,
          bio: null,
          followers: null,
          following: null,
          repos: null,
          location: null
        };
      });
  });

  var userPromise = Promise.all(userRequests).then(function (results) {
    results.forEach(function (result) {
      var elements = userMap[result.username] || [];
      elements.forEach(function (element) {
        var avatarEl = element.querySelector('[data-user-avatar]');
        if (avatarEl) {
          if (result.avatar) {
            avatarEl.style.backgroundImage = 'url(' + result.avatar + ')';
            avatarEl.classList.add('loaded');
          } else {
            avatarEl.style.backgroundImage = '';
            avatarEl.classList.remove('loaded');
          }
        }

        var bioEl = element.querySelector('[data-user-bio]');
        if (bioEl) {
          var text = result.bio ? result.bio : 'GitHub profile overview.';
          bioEl.textContent = text;
        }

        var followersEl = element.querySelector('[data-user-followers]');
        if (followersEl) {
          followersEl.textContent = typeof result.followers === 'number' ? result.followers.toLocaleString() : 'N/A';
        }

        var reposEl = element.querySelector('[data-user-repos]');
        if (reposEl) {
          reposEl.textContent = typeof result.repos === 'number' ? result.repos.toLocaleString() : 'N/A';
        }

        var followingEl = element.querySelector('[data-user-following]');
        if (followingEl) {
          followingEl.textContent = typeof result.following === 'number' ? result.following.toLocaleString() : 'N/A';
        }

        var locationEl = element.querySelector('[data-user-location]');
        if (locationEl) {
          if (result.location) {
            locationEl.textContent = result.location;
            locationEl.style.display = '';
          } else {
            locationEl.textContent = '';
            locationEl.style.display = 'none';
          }
        }
      });
    });
  });

  Promise.all([repoPromise, userPromise]).catch(function () {
    // Errors are already handled in individual promises; this prevents unhandled rejections.
  });
});
