(function () {
  "use strict";

  var LS_VERSION = "disconnected-webapplication-3-v4";
  var SESSION_KEY = "dw3-session";
  var FIXTURE_KEY = "dw3-anonymous-v4";
  var SEED_USER_COUNT = 2185;
  var USER_PAGE_SIZE = 25;
  var PRODUCT_TITLE = "Disconnected";
  var DEMO_USERNAME = "admin";
  var DEMO_PASSWORD = "admin123";

  var ONLINE_RAIL = [
    { initials: "AA", label: "Admin..." },
    { initials: "JC", label: "Ops..." },
    { initials: "CH", label: "Charge..." },
    { initials: "KH", label: "Pharm..." },
    { initials: "BT", label: "Tech..." },
    { initials: "TE", label: "Training..." },
    { initials: "HT", label: "House..." },
    { initials: "AJ", label: "Analyst..." },
    { initials: "SK", label: "Support..." },
    { initials: "LM", label: "Lead..." }
  ];

  var state = {
    db: null,
    session: null,
    route: { name: "login", id: null },
    toast: null,
    actionsOpen: false,
    userDraft: null,
    roleDraft: null
  };

  function defaultFacilities() {
    return [
      { id: "fac-bh-mesa", name: "Regional BH — Mesa Campus" },
      { id: "fac-ch-centers", name: "Community Health Centers" },
      { id: "fac-west", name: "Regional Health — West Campus" },
      { id: "fac-medical", name: "Regional Medical Center" }
    ];
  }

  function defaultAreas() {
    return [
      { id: "msd-2-3", label: "MSD 2 & 3" },
      { id: "msd-4-5", label: "MSD 4 & 5" },
      { id: "msd-5-6", label: "MSD 5 & 6" },
      { id: "msd-6-7", label: "MSD 6 & 7" },
      { id: "7a-crit", label: "7A CRIT CARE" },
      { id: "7b-crit", label: "7B CRIT CARE" },
      { id: "7c-crit", label: "7C CRIT CARE" },
      { id: "7d-crit", label: "7D CRIT CARE" },
      { id: "8a-med", label: "8A MEDICINE" },
      { id: "rmc-ed", label: "RMC ED" },
      { id: "rmc-onc", label: "RMC Med/Onc" },
      { id: "surg-trum", label: "Surg/Traum/Proc" },
      { id: "ortho", label: "BB ORTHOPEDICS" },
      { id: "picu", label: "PICU" },
      { id: "east-clinic", label: "East Clinic" },
      { id: "north-clinic", label: "North Clinic" },
      { id: "west-ed", label: "West ED" },
      { id: "preop", label: "Pre-Op/Recovery" },
      { id: "pharm-central", label: "Pharmacy Central" },
      { id: "pharm-iv", label: "Pharmacy IV Room" },
      { id: "imaging-proc", label: "Imaging/Procedural" },
      { id: "rmc-ob", label: "RMC OB" },
      { id: "rmc-recu", label: "RMC RECU" },
      { id: "burn-unit", label: "Burn Unit" }
    ];
  }

  function defaultRoles() {
    var all = defaultAreas().map(function (a) { return a.id; });
    var clinical = [
      "msd-2-3", "msd-4-5", "msd-5-6", "msd-6-7", "7a-crit", "7b-crit", "7c-crit", "7d-crit",
      "8a-med", "rmc-ed", "picu", "preop", "rmc-ob", "rmc-recu"
    ];
    var pharmacy = ["pharm-central", "pharm-iv", "east-clinic", "north-clinic"];
    var tech = ["imaging-proc", "surg-trum", "ortho", "burn-unit"];
    var supervisor = clinical.concat(["west-ed"]);
    function role(id, name, areaIds) {
      return { id: id, name: name, areaIds: areaIds };
    }
    return [
      role("area-tech", "Area Tech", tech),
      role("area-supv", "AreaSupv", supervisor),
      role("area-tech-srna", "Area Tech / SRNA", tech.concat(clinical.slice(0, 6))),
      role("house-supv", "House Supv", supervisor),
      role("ident-access", "Ident Access Specialist", all),
      role("instructor", "Instructor", clinical.slice(0, 10)),
      role("logistics", "Logistics Specialist", tech.concat(pharmacy)),
      role("ma", "MA", clinical.slice(0, 8)),
      role("pharmacist", "Pharmacist", pharmacy),
      role("resp-ther", "Resp Ther", clinical.concat(["rmc-recu"])),
      role("rn-supv", "RN Supv", supervisor),
      role("rnpa", "RNPA", clinical),
      role("rn", "RN", clinical),
      role("tech", "Tech", tech),
      role("tech-specialty", "Tech Specialty", tech.concat(pharmacy.slice(0, 2))),
      role("pharm-tech", "Pharmacy Tech", pharmacy),
      role("system-admin", "System Admin", all)
    ];
  }

  function makeUser(row) {
    return {
      id: row.id,
      userId: row.userId,
      active: row.active !== false,
      locked: false,
      unrestrictedUserMgmt: false,
      exemptBioId: !!row.exemptBioId,
      firstName: row.firstName,
      middleName: "",
      lastName: row.lastName,
      suffix: "",
      initials: row.initials,
      jobTitle: row.jobTitle,
      roleId: row.roleId,
      userScanCode: "",
      email: row.email,
      accountExpiration: "Never",
      domain: "No",
      facilityId: row.facilityId,
      assignedAreaIds: row.assignedAreaIds || [],
      employee: row.employee || "Yes",
      location: row.location || "Regional Health System",
      startDate: row.startDate,
      manager: row.manager || "Manager, Demo",
      extraRoleIds: row.extraRoleIds || []
    };
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function defaultUsers() {
    var facilities = defaultFacilities();
    var roles = defaultRoles();
    var roleIds = roles.map(function (r) { return r.id; });
    var jobTitles = [
      "Analyst", "Medical Coder", "RN", "Pharmacist", "Developer", "Senior Manager",
      "Non-Employee", "Clinical Resource Leader", "Retired", "Technician"
    ];
    var firstNames = [
      "Alex", "Ankit", "Ankur", "Anshul", "Blake", "Casey", "Dana", "Elliot", "Finley",
      "Gray", "Harper", "Indigo", "Jules", "Kai", "Logan", "Morgan", "Noah", "Oakley",
      "Parker", "Quinn", "Riley", "Sage", "Taylor", "Uma", "Violet", "Winter"
    ];
    var lastNames = [
      "Chen", "Davis", "Evans", "Foster", "Garcia", "Hayes", "Ingram", "Jones", "Klein",
      "Lopez", "Mitchell", "Nguyen", "Ortiz", "Patel", "Reed", "Scott", "Turner", "Upton",
      "Vance", "Wells", "Xu", "Young", "Zimmerman", "Brooks", "Clark", "Edwards"
    ];
    var users = [];
    users.push(makeUser({
      id: "u-jmorgan1",
      userId: "jmorgan1",
      exemptBioId: true,
      firstName: "Jordan",
      lastName: "Morgan",
      initials: "JM",
      jobTitle: "Clinical Resource Leader",
      roleId: "rn-supv",
      email: "jordan.morgan@example-health.org",
      facilityId: "fac-bh-mesa",
      assignedAreaIds: ["msd-2-3", "msd-4-5", "msd-5-6"],
      startDate: "01/15/2019",
      manager: "Chen, Alex"
    }));

    var i;
    for (i = 1; i < SEED_USER_COUNT; i++) {
      var firstName = firstNames[i % firstNames.length];
      var lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      var userId = firstName.toLowerCase().charAt(0) + lastName.toLowerCase() + i;
      var fac = facilities[i % facilities.length];
      var roleId = roleIds[i % roleIds.length];
      var month = (i % 12) + 1;
      var day = (i % 28) + 1;
      var year = 2010 + (i % 14);
      users.push(makeUser({
        id: "u-" + userId,
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        initials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(),
        jobTitle: jobTitles[i % jobTitles.length],
        roleId: roleId,
        facilityId: fac.id,
        email: userId + "@example-health.org",
        startDate: pad2(month) + "/" + pad2(day) + "/" + year,
        employee: i % 17 === 0 ? "No" : "Yes",
        location: i % 6 === 0 ? "Contractor Site" : "Regional Health System",
        assignedAreaIds: i % 3 === 0 ? ["7a-crit", "rmc-ed"] : i % 3 === 1 ? ["pharm-central"] : ["msd-2-3"],
        manager: lastNames[(i + 3) % lastNames.length] + ", " + firstNames[(i + 5) % firstNames.length]
      }));
    }
    return users;
  }

  function defaultDb() {
    return {
      version: 4,
      fixtureKey: FIXTURE_KEY,
      seedUserCount: SEED_USER_COUNT,
      facilities: defaultFacilities(),
      areas: defaultAreas(),
      roles: defaultRoles(),
      users: defaultUsers()
    };
  }

  function dbNeedsReseed(db) {
    if (!db || db.fixtureKey !== FIXTURE_KEY) return true;
    if ((db.users || []).length < SEED_USER_COUNT) return true;
    var blob = JSON.stringify(db).toLowerCase();
    var banned = ["valleywise", "yabebe", "abebe", "agarwal", "nardita", "wolters", "bob.thomas", "vhmc-bh"];
    return banned.some(function (term) { return blob.indexOf(term) >= 0; });
  }

  function uid(prefix) {
    return (prefix || "id") + "-" + Math.random().toString(36).slice(2, 10);
  }

  function displayName(user) {
    return user.lastName + ", " + user.firstName + " (" + user.userId + ")";
  }

  function syncXhr(method, url, body) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    if (body !== undefined) {
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    } else {
      xhr.send();
    }
    return xhr;
  }

  function loadServerDb() {
  try {
      var xhr = syncXhr("GET", "/api/db");
      if (xhr.status === 200) return JSON.parse(xhr.responseText);
      if (xhr.status === 204) return null;
    } catch (e) { /* offline / file:// */ }
    try {
      var raw = localStorage.getItem(LS_VERSION);
      if (raw) return JSON.parse(raw);
    } catch (e2) {}
    return null;
  }

  function saveDb(db) {
    var body = JSON.stringify(db);
    try {
      var xhr = syncXhr("PUT", "/api/db", body);
      if (xhr.status === 204) return true;
    } catch (e) {}
    try {
      localStorage.setItem(LS_VERSION, body);
      return true;
    } catch (e2) {}
    return false;
  }

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function saveSession(sess) {
    if (sess) sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function showToast(msg) {
    state.toast = msg;
    render();
    setTimeout(function () {
      if (state.toast === msg) {
        state.toast = null;
        render();
      }
    }, 2800);
  }

  var STUB_ROUTES = {
    settings: "Settings",
    preferences: "Preferences",
    medications: "Medications",
    medinventory: "Med Inventory",
    reports: "Audit Reports",
    operations: "Operations"
  };

  function parseHash() {
    var hash = location.hash;
    if (!hash || hash === "#") {
      return { name: state.session ? "home" : "login", id: null };
    }
    var parts = hash.slice(2).split("/");
    var name = parts[0] || (state.session ? "home" : "login");
    var id = parts[1] || null;
    return { name: name, id: id };
  }

  function navigate(name, id) {
    location.hash = "#/" + name + (id ? "/" + encodeURIComponent(id) : "");
  }

  function roleById(roleId) {
    return (state.db.roles || []).find(function (r) { return r.id === roleId; });
  }

  function areaLabel(areaId) {
    var a = state.db.areas.find(function (x) { return x.id === areaId; });
    return a ? a.label : areaId;
  }

  function allowedAreasForRole(roleId) {
    var role = roleById(roleId);
    return role ? role.areaIds.slice() : [];
  }

  function emptyUserDraft() {
    return {
      id: null,
      userId: "",
      active: true,
      locked: false,
      unrestrictedUserMgmt: false,
      exemptBioId: false,
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      initials: "",
      jobTitle: "",
      roleId: state.db.roles[0] ? state.db.roles[0].id : "",
      userScanCode: "",
      email: "",
      accountExpiration: "Never",
      domain: "No",
      facilityId: state.db.facilities[0] ? state.db.facilities[0].id : "",
      assignedAreaIds: [],
      employee: "Yes",
      location: "",
      startDate: "",
      manager: "",
      extraRoleIds: []
    };
  }

  function emptyRoleDraft() {
    return {
      id: null,
      name: "",
      areaIds: []
    };
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === "className") node.className = props[k];
        else if (k === "htmlFor") node.htmlFor = props[k];
        else if (k === "text") node.textContent = props[k];
        else if (k === "id") node.id = props[k];
        else if (k.startsWith("on") && typeof props[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        else if (k === "hidden") {
          if (props[k]) node.setAttribute("hidden", "hidden");
        } else node.setAttribute(k, props[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  function renderLogin(root) {
    var err = "";
    root.appendChild(el("div", { id: "login-screen" }, [
      el("div", { className: "login-card" }, [
        el("div", { className: "login-brand" }, [
          el("span", { className: "hex" }),
          el("span", { text: PRODUCT_TITLE })
        ]),
        el("div", { className: "login-error", id: "login-error", hidden: !err }),
        el("label", {}, [
          "Username",
          el("input", { type: "text", id: "login-username", autocomplete: "username" })
        ]),
        el("label", {}, [
          "Password",
          el("input", { type: "password", id: "login-password", autocomplete: "current-password" })
        ]),
        el("button", {
          className: "btn-signin",
          id: "login-submit",
          type: "button",
          onClick: function () {
            var u = document.getElementById("login-username").value.trim();
            var p = document.getElementById("login-password").value;
            if (!u || !p) {
              var box = document.getElementById("login-error");
              box.removeAttribute("hidden");
              box.textContent = "Enter username and password.";
              return;
            }
            if (u !== DEMO_USERNAME || p !== DEMO_PASSWORD) {
              var bad = document.getElementById("login-error");
              bad.removeAttribute("hidden");
              bad.textContent = "Invalid username or password.";
              return;
            }
            state.session = { username: u, display: u };
            saveSession(state.session);
            navigate("home");
          }
        }, ["Sign In"])
      ])
    ]));
  }

  function shellHeader(active) {
    var sess = state.session || {};
    return el("div", { id: "app-shell" }, [
      el("header", { className: "pyxis-top" }, [
        el("div", { className: "brand", text: PRODUCT_TITLE }),
        el("nav", {}, [
          linkNav("home", "Home", active),
          linkNav("preferences", "Preferences", active),
          linkNav("reports", "Audit Reports", active),
          linkNav("actions", "Actions", active),
          linkNav("users", "Users", active),
          linkNav("roles", "Roles", active),
          linkNav("settings", "Settings", active),
          linkNav("medications", "Medications", active),
          linkNav("medinventory", "Med Inventory", active),
          linkNav("operations", "Operations", active)
        ]),
        el("div", { className: "session" }, [
          document.createTextNode("Mountain Standard Time | "),
          el("span", { text: "ControlCenter... | " + (sess.display || sess.username || "User") + " | " }),
          el("a", {
            href: "#/login",
            text: "Sign Out",
            onClick: function (ev) {
              ev.preventDefault();
              state.session = null;
              saveSession(null);
              navigate("login");
            }
          })
        ])
      ])
    ]);
  }

  function linkNav(name, label, active) {
    return el("a", {
      id: "nav-" + name,
      href: "#/" + name,
      className: active === name ? "active" : "",
      text: label,
      onClick: function (ev) {
        ev.preventDefault();
        state.actionsOpen = false;
        navigate(name);
      }
    });
  }

  function launchButton(route, label, id) {
    return el("button", {
      className: "btn launch-btn",
      id: id || undefined,
      type: "button",
      onClick: function () { navigate(route); }
    }, [label]);
  }

  function renderFixtureHub(sectionTitle) {
    var count = (state.db.users || []).length;
    return el("div", {}, [
      el("div", { className: "welcome-panel" }, [
        el("h2", { text: sectionTitle }),
        el("p", {
          text: "This module is not fully simulated in the disconnected fixture. Use the options below to manage accounts and roles."
        })
      ]),
      el("div", { className: "fixture-launchpad" }, [
        launchButton("users", "Users — " + count + " accounts", "hub-users"),
        launchButton("roles", "Roles — area metadata per User Type", "hub-roles"),
        launchButton("home", "Home — Actions menu (Create User / Role)", "hub-actions")
      ])
    ]);
  }

  function teamRail() {
    var items = ONLINE_RAIL.map(function (p) {
      return el("div", {}, [
        el("div", { className: "avatar", title: p.label, text: p.initials }),
        el("div", { className: "avatar-name", text: p.label })
      ]);
    });
    return el("aside", { className: "team-rail", "aria-label": "Team" }, [
      el("div", { className: "rail-title", text: "Online (" + ONLINE_RAIL.length + ")" })
    ].concat(items));
  }

  function wrapMain(shell, subhead, content) {
    var workspace = el("div", { className: "workspace" });
    workspace.appendChild(subhead);
    var mc = el("div", { id: "main-content" });
    mc.appendChild(content);
    workspace.appendChild(mc);
    var body = el("div", { className: "app-body" }, [workspace, teamRail()]);
    shell.appendChild(el("div", { className: "nav-strip" }));
    shell.appendChild(body);
    return shell;
  }

  function renderHome() {
    var content = el("div", {}, [
      el("p", { className: "page-title", text: "Welcome to " + PRODUCT_TITLE }),
      el("div", { className: "welcome-panel" }, [
        el("h2", { text: "Welcome to " + PRODUCT_TITLE + " where you can access the following features to:" }),
        el("ul", {}, [
          el("li", { text: "Workforce — User and account management." }),
          el("li", { text: "Access — Facility and assigned-area controls." }),
          el("li", { text: "Actions — Create and update records." }),
          el("li", { text: "Compliance — Audit-oriented views (simulated)." }),
          el("li", { text: "Governance — Roles and entitlements." }),
          el("li", { text: "Dashboard — Summary landing (this page)." })
        ]),
        el("div", { className: "welcome-hint", text: "Send an action item from the menu below to proceed." })
      ]),
      el("div", { className: "fixture-launchpad home-launchpad" }, [
        launchButton("users", "Open Users (Accounts)"),
        launchButton("roles", "Open Roles"),
        launchButton("settings", "Open Settings")
      ]),
      el("div", { className: "actions-bar" }, [
        el("button", {
          className: "btn",
          id: "btn-actions",
          type: "button",
          onClick: function () {
            state.actionsOpen = !state.actionsOpen;
            render();
          }
        }, ["Actions"]),
        el("div", { className: "actions-menu" + (state.actionsOpen ? " open" : "") }, [
          el("div", { className: "item", text: "Create" }),
          el("div", { className: "sub" }, [
            el("div", {
              className: "item",
              id: "action-create-user",
              onClick: function () {
                state.userDraft = emptyUserDraft();
                state.actionsOpen = false;
                navigate("users", "new");
              }
            }, ["Create User"]),
            el("div", {
              className: "item",
              id: "action-create-role",
              onClick: function () {
                state.userDraft = null;
                navigate("roles", "new");
              }
            }, ["Create Role"]),
            el("div", { className: "item", text: "Create Account" }),
            el("div", { className: "item", text: "Create Policy" }),
            el("div", { className: "item", text: "Create Application" }),
            el("div", { className: "item", text: "Create Bundle" })
          ]),
          el("div", { className: "item", text: "Update" }),
          el("div", { className: "item", text: "Delete" })
        ])
      ]),
      el("p", { className: "actions-footnote", text: "Send an option from the list below" })
    ]);
    return content;
  }

  function renderUsersList() {
    var search = state.userListSearch || "";
    var facilityFilter = state.userListFacility || "";
    var users = state.db.users.filter(function (u) {
      var name = displayName(u).toLowerCase();
      if (search && name.indexOf(search.toLowerCase()) < 0 && u.userId.toLowerCase().indexOf(search.toLowerCase()) < 0) return false;
      if (facilityFilter && u.facilityId !== facilityFilter) return false;
      return true;
    });

    var visible = state.userListVisible || USER_PAGE_SIZE;
    if (visible < USER_PAGE_SIZE) visible = USER_PAGE_SIZE;
    state.userListVisible = visible;
    var pageUsers = users.slice(0, visible);
    var rangeFrom = users.length === 0 ? 0 : 1;
    var rangeTo = Math.min(visible, users.length);
    var canShowMore = visible < users.length;

    var tbody = el("tbody", {});
    pageUsers.forEach(function (u) {
      var fac = state.db.facilities.find(function (f) { return f.id === u.facilityId; });
      tbody.appendChild(el("tr", {}, [
        el("td", {}, [el("input", { type: "checkbox" })]),
        el("td", {}, [
          el("a", {
            href: "#/users/" + encodeURIComponent(u.id),
            text: displayName(u),
            onClick: function () { navigate("users", u.id); }
          })
        ]),
        el("td", { text: u.jobTitle || "" }),
        el("td", { text: u.employee || "Yes" }),
        el("td", { text: u.location || "" }),
        el("td", { text: u.startDate || "" }),
        el("td", { text: fac ? fac.name : "" }),
        el("td", { text: u.manager || "" })
      ]));
    });

    var facilityOptions = [el("option", { value: "", text: "All" })];
    state.db.facilities.forEach(function (f) {
      facilityOptions.push(el("option", { value: f.id, text: f.name, selected: facilityFilter === f.id ? "selected" : null }));
    });

    return el("div", {}, [
      el("div", { className: "accounts-heading", text: "Accounts" }),
      el("div", { className: "toolbar" }, [
        el("span", { text: "Filter by:" }),
        el("select", {
          id: "filter-facility",
          onChange: function (ev) {
            state.userListFacility = ev.target.value;
            state.userListVisible = USER_PAGE_SIZE;
            render();
          }
        }, facilityOptions),
        el("input", {
          type: "search",
          id: "filter-search",
          placeholder: "Search",
          value: search,
          onInput: function (ev) {
            state.userListSearch = ev.target.value;
            state.userListVisible = USER_PAGE_SIZE;
            render();
          }
        }),
        el("button", {
          className: "btn",
          type: "button",
          text: "Clear Filters",
          onClick: function () {
            state.userListSearch = "";
            state.userListFacility = "";
            state.userListVisible = USER_PAGE_SIZE;
            render();
          }
        }),
        el("button", {
          className: "btn",
          type: "button",
          text: "Create New...",
          onClick: function () {
            state.userDraft = emptyUserDraft();
            navigate("users", "new");
          }
        })
      ]),
      el("div", { className: "table-wrap" }, [
        el("table", { className: "data", id: "users-table" }, [
          el("thead", {}, [
            el("tr", {}, [
              el("th", { text: "" }),
              el("th", { text: "Identity" }),
              el("th", { text: "Job Title" }),
              el("th", { text: "Employee" }),
              el("th", { text: "Location" }),
              el("th", { text: "StartDate" }),
              el("th", { text: "Facility" }),
              el("th", { text: "Manager" })
            ])
          ]),
          tbody
        ])
      ]),
      el("div", { className: "list-pager" }, [
        document.createTextNode(rangeFrom + " - " + rangeTo + " of " + state.db.users.length + "  "),
        el("a", {
          href: "#",
          className: "show-more",
          text: canShowMore ? "Show more" : "",
          onClick: function (ev) {
            ev.preventDefault();
            if (canShowMore) {
              state.userListVisible = visible + USER_PAGE_SIZE;
              render();
            }
          }
        })
      ]),
      el("div", { className: "users-footer-actions" }, [
        el("button", { className: "btn", type: "button", text: "Save" }),
        el("button", { className: "btn", type: "button", text: "Cancel" }),
        el("button", { className: "btn", type: "button", text: "Assign Roles" }),
        el("button", { className: "btn", type: "button", text: "Add Role" })
      ])
    ]);
  }

  function renderUserForm(user) {
    var isNew = !user.id;
    var draft = state.userDraft || user;
  if (!draft.extraRoleIds) draft.extraRoleIds = [];
    state.userDraft = draft;

    function setField(key, value) {
      draft[key] = value;
      if (key === "roleId") {
        var allowed = allowedAreasForRole(value);
        draft.assignedAreaIds = draft.assignedAreaIds.filter(function (id) {
          return allowed.indexOf(id) >= 0;
        });
      }
      render();
    }

    var roleOptions = state.db.roles.map(function (r) {
      return el("option", { value: r.id, text: r.name, selected: draft.roleId === r.id ? "selected" : null });
    });
    var facOptions = state.db.facilities.map(function (f) {
      return el("option", { value: f.id, text: f.name, selected: draft.facilityId === f.id ? "selected" : null });
    });

    var allowed = allowedAreasForRole(draft.roleId);
    var areaLabels = [];
    allowed.forEach(function (aid) {
      var checked = draft.assignedAreaIds.indexOf(aid) >= 0;
      areaLabels.push(el("label", {}, [
        el("input", {
          type: "checkbox",
          checked: checked,
          onChange: function (ev) {
            if (ev.target.checked) {
              if (draft.assignedAreaIds.indexOf(aid) < 0) draft.assignedAreaIds.push(aid);
            } else {
              draft.assignedAreaIds = draft.assignedAreaIds.filter(function (x) { return x !== aid; });
            }
          }
        }),
        " " + areaLabel(aid)
      ]));
    });

    return el("div", { className: "form-shell" }, [
      el("div", { className: "form-section" }, [
        el("h3", { text: "General Information" }),
        el("div", { className: "chk-row" }, [
          chk("Active", draft.active, function (v) { setField("active", v); }),
          chk("Locked Account", draft.locked, function (v) { setField("locked", v); }),
          chk("Unrestricted User Management", draft.unrestrictedUserMgmt, function (v) { setField("unrestrictedUserMgmt", v); }),
          chk("Exempt from Bio ID", draft.exemptBioId, function (v) { setField("exemptBioId", v); })
        ]),
        fieldGrid([
          ["First Name", el("input", { id: "field-first-name", value: draft.firstName, onInput: function (e) { draft.firstName = e.target.value; } })],
          ["Middle Name", el("input", { value: draft.middleName, onInput: function (e) { draft.middleName = e.target.value; } })],
          ["Last Name", el("input", { value: draft.lastName, onInput: function (e) { draft.lastName = e.target.value; } })],
          ["Suffix", el("input", { value: draft.suffix, onInput: function (e) { draft.suffix = e.target.value; } })],
          ["Initials", el("input", { value: draft.initials, onInput: function (e) { draft.initials = e.target.value; } })],
          ["Job Title", el("input", { value: draft.jobTitle, onInput: function (e) { draft.jobTitle = e.target.value; } })],
          ["User Type", el("select", {
            id: "field-user-type",
            onChange: function (e) { setField("roleId", e.target.value); }
          }, roleOptions)],
          ["User Scan Code", el("input", { value: draft.userScanCode, onInput: function (e) { draft.userScanCode = e.target.value; } })]
        ])
      ]),
      el("div", { className: "form-section" }, [
        el("h3", { text: "Account details" }),
        fieldGrid([
          ["User ID", el("input", { id: "field-user-id", value: draft.userId, onInput: function (e) { draft.userId = e.target.value; } })],
          ["Email", el("input", { value: draft.email, onInput: function (e) { draft.email = e.target.value; } })],
          ["Account Expiration", el("input", { value: draft.accountExpiration, onInput: function (e) { draft.accountExpiration = e.target.value; } })],
          ["Domain", el("input", { value: draft.domain, onInput: function (e) { draft.domain = e.target.value; } })]
        ])
      ]),
      el("div", { className: "form-section" }, [
        el("h3", { text: "Select Roles" }),
        el("div", { className: "role-select-columns" }, [
          el("div", { className: "role-select-col" }, state.db.roles.slice(0, Math.ceil(state.db.roles.length / 2)).map(function (r) {
            var checked = draft.extraRoleIds.indexOf(r.id) >= 0 || draft.roleId === r.id;
            return el("label", {}, [
              el("input", {
                type: "checkbox",
                checked: checked,
                onChange: function (ev) {
                  if (r.id === draft.roleId) return;
                  if (ev.target.checked) {
                    if (draft.extraRoleIds.indexOf(r.id) < 0) draft.extraRoleIds.push(r.id);
                  } else {
                    draft.extraRoleIds = draft.extraRoleIds.filter(function (x) { return x !== r.id; });
                  }
                }
              }),
              " " + r.name
            ]);
          })),
          el("div", { className: "role-select-col" }, state.db.roles.slice(Math.ceil(state.db.roles.length / 2)).map(function (r) {
            var checked = draft.extraRoleIds.indexOf(r.id) >= 0 || draft.roleId === r.id;
            return el("label", {}, [
              el("input", {
                type: "checkbox",
                checked: checked,
                onChange: function (ev) {
                  if (r.id === draft.roleId) return;
                  if (ev.target.checked) {
                    if (draft.extraRoleIds.indexOf(r.id) < 0) draft.extraRoleIds.push(r.id);
                  } else {
                    draft.extraRoleIds = draft.extraRoleIds.filter(function (x) { return x !== r.id; });
                  }
                }
              }),
              " " + r.name
            ]);
          }))
        ])
      ]),
      el("div", { className: "form-section" }, [
        el("h3", { text: "Access" }),
        fieldGrid([
          ["Select Facility", el("select", {
            id: "field-facility",
            onChange: function (e) { draft.facilityId = e.target.value; }
          }, facOptions)]
        ]),
        el("div", { className: "access-areas-block" }, [
          el("strong", { text: "Assigned Areas" }),
          el("div", { className: "areas-toolbar" }, [
            el("a", {
              text: "Select All",
              onClick: function (ev) {
                ev.preventDefault();
                draft.assignedAreaIds = allowed.slice();
                render();
              }
            }),
            el("a", {
              text: "Select None",
              onClick: function (ev) {
                ev.preventDefault();
                draft.assignedAreaIds = [];
                render();
              }
            })
          ]),
          el("div", { className: "areas-panel", id: "assigned-areas-panel" }, areaLabels)
        ])
      ]),
      el("div", { className: "form-actions" }, [
        el("button", {
          className: "btn",
          type: "button",
          text: "Cancel",
          onClick: function () {
            state.userDraft = null;
            navigate("users");
          }
        }),
        el("button", {
          className: "btn-primary",
          id: "btn-save-user",
          type: "button",
          text: "Save",
          onClick: function () {
            if (!draft.userId || !draft.firstName || !draft.lastName) {
              alert("User ID, first name, and last name are required.");
              return;
            }
            var copy = JSON.parse(JSON.stringify(draft));
            if (isNew) {
              copy.id = uid("u");
              state.db.users.push(copy);
            } else {
              var idx = state.db.users.findIndex(function (u) { return u.id === copy.id; });
              if (idx >= 0) state.db.users[idx] = copy;
            }
            saveDb(state.db);
            state.userDraft = null;
            showToast("User saved.");
            navigate("users", copy.id);
          }
        })
      ])
    ]);
  }

  function chk(label, value, onChange) {
    return el("label", {}, [
      el("input", {
        type: "checkbox",
        checked: value,
        onChange: function (e) { onChange(e.target.checked); }
      }),
      " " + label
    ]);
  }

  function fieldGrid(rows) {
    var grid = el("div", { className: "form-grid" });
    rows.forEach(function (row) {
      grid.appendChild(el("span", { text: row[0] }));
      grid.appendChild(row[1]);
    });
    return grid;
  }

  function renderRolesList() {
    var tbody = el("tbody", {});
    state.db.roles.forEach(function (r) {
      tbody.appendChild(el("tr", {}, [
        el("td", {}, [
          el("a", {
            href: "#/roles/" + encodeURIComponent(r.id),
            text: r.name,
            onClick: function () { navigate("roles", r.id); }
          })
        ]),
        el("td", { text: String(r.areaIds.length) }),
        el("td", { text: r.id })
      ]));
    });
    return el("div", {}, [
      el("div", { className: "toolbar" }, [
        el("button", {
          className: "btn",
          type: "button",
          text: "Add Role",
          onClick: function () { navigate("roles", "new"); }
        })
      ]),
      el("div", { className: "table-wrap" }, [
        el("table", { className: "data", id: "roles-table" }, [
          el("thead", {}, [
            el("tr", {}, [
              el("th", { text: "Role Name" }),
              el("th", { text: "Assignable areas" }),
              el("th", { text: "Role ID" })
            ])
          ]),
          tbody
        ])
      ])
    ]);
  }

  function renderRoleForm(role) {
    var isNew = !role || !role.id;
    var draft = state.roleDraft || (role ? JSON.parse(JSON.stringify(role)) : emptyRoleDraft());
    state.roleDraft = draft;

    var boxes = state.db.areas.map(function (a) {
      var checked = draft.areaIds.indexOf(a.id) >= 0;
      return el("label", {}, [
        el("input", {
          type: "checkbox",
          checked: checked,
          onChange: function (ev) {
            if (ev.target.checked) {
              if (draft.areaIds.indexOf(a.id) < 0) draft.areaIds.push(a.id);
            } else {
              draft.areaIds = draft.areaIds.filter(function (x) { return x !== a.id; });
            }
            render();
          }
        }),
        " " + a.label
      ]);
    });

    return el("div", { className: "form-shell" }, [
      el("div", { className: "form-section" }, [
        el("h3", { text: "Role definition" }),
        fieldGrid([
          ["Role name", el("input", {
            id: "field-role-name",
            value: draft.name,
            onInput: function (e) { draft.name = e.target.value; }
          })]
        ]),
        el("p", { style: "grid-column: 1 / -1; font-size:12px; color:#555;", text: "Each role stores metadata for which areas may be assigned to users with that User Type." }),
        el("strong", { style: "grid-column: 1 / -1;", text: "Assign areas (role metadata)" }),
        el("div", { className: "areas-panel", id: "role-areas-panel" }, boxes)
      ]),
      el("div", { className: "form-actions" }, [
        el("button", {
          className: "btn",
          type: "button",
          text: "Cancel",
          onClick: function () {
            state.roleDraft = null;
            navigate("roles");
          }
        }),
        el("button", {
          className: "btn-primary",
          id: "btn-save-role",
          type: "button",
          text: "Save",
          onClick: function () {
            if (!draft.name.trim()) {
              alert("Role name is required.");
              return;
            }
            var slug = draft.id || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            var copy = { id: slug, name: draft.name.trim(), areaIds: draft.areaIds.slice() };
            var exists = state.db.roles.findIndex(function (r) { return r.id === copy.id; });
            if (isNew && exists >= 0) {
              copy.id = slug + "-" + Math.random().toString(36).slice(2, 6);
            }
            if (isNew) state.db.roles.push(copy);
            else {
              var editId = role ? role.id : state.route.id;
              var idx = state.db.roles.findIndex(function (r) { return r.id === editId; });
              if (idx >= 0) {
                if (copy.id !== editId) {
                  copy.id = editId;
                }
                state.db.roles[idx] = copy;
              }
            }
            saveDb(state.db);
            state.roleDraft = null;
            showToast("Role saved.");
            navigate("roles", copy.id);
          }
        })
      ])
    ]);
  }

  function render() {
    var root = document.getElementById("app");
    root.innerHTML = "";

    state.route = parseHash();

    if (!state.session && state.route.name !== "login") {
      navigate("login");
      return;
    }

    if (state.route.name === "login") {
      renderLogin(root);
      return;
    }

    var shell = shellHeader(state.route.name);
    var title = "";
    var crumb = "Home";
    var body;

    if (state.route.name === "home" || state.route.name === "actions") {
      title = "Home";
      crumb = "Home";
      body = renderHome();
    } else if (state.route.name === "users") {
      crumb = "Home > User Management";
      if (state.route.id === "new") {
        title = "Add User";
        body = renderUserForm(emptyUserDraft());
      } else if (state.route.id) {
        var u = state.db.users.find(function (x) { return x.id === state.route.id; });
        if (!u) {
          body = el("p", { text: "User not found." });
          title = "Users";
        } else {
          title = displayName(u);
          crumb += " > Edit User";
          if (!state.userDraft || state.userDraft.id !== u.id) state.userDraft = JSON.parse(JSON.stringify(u));
          body = renderUserForm(u);
        }
      } else {
        title = "Accounts";
        body = renderUsersList();
      }
    } else if (state.route.name === "roles") {
      crumb = "Home > Role Management";
      if (state.route.id === "new") {
        title = "Add Role";
        state.roleDraft = state.roleDraft || emptyRoleDraft();
        body = renderRoleForm(null);
      } else if (state.route.id) {
        var r = state.db.roles.find(function (x) { return x.id === state.route.id; });
        if (!r) body = el("p", { text: "Role not found." });
        else {
          title = "Edit Role — " + r.name;
          body = renderRoleForm(r);
        }
      } else {
        title = "Roles";
        body = renderRolesList();
      }
    } else if (STUB_ROUTES[state.route.name]) {
      title = STUB_ROUTES[state.route.name];
      crumb = "Home > " + title;
      body = renderFixtureHub(title);
    } else {
      title = "Not found";
      body = el("div", { className: "welcome-panel" }, [
        el("p", { text: "That page is not available." }),
        el("div", { className: "fixture-launchpad" }, [
          launchButton("home", "Return to Home"),
          launchButton("users", "Open Users")
        ])
      ]);
    }

    var sub = el("div", { className: "subhead" }, [
      el("div", { className: "breadcrumb", text: crumb }),
      el("div", {}, [el("strong", { text: title })])
    ]);

    wrapMain(shell, sub, body);
    root.appendChild(shell);

    if (state.toast) {
      root.appendChild(el("div", { className: "toast", text: state.toast }));
    }
  }

  function boot() {
    var loaded = loadServerDb();
    if (!loaded || dbNeedsReseed(loaded)) {
      state.db = defaultDb();
      saveDb(state.db);
    } else {
      state.db = loaded;
    }

    state.session = loadSession();
    if (state.session && (!location.hash || location.hash === "#")) {
      navigate("home");
    }
    window.addEventListener("hashchange", render);
    render();
  }

  boot();
})();