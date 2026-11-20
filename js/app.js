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
    openMenu: null,
    selectedUserId: null,
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
    var byFacility = defaultRoleFacilities();
    function role(id, name, areaIds) {
      return { id: id, name: name, areaIds: areaIds, facilityIds: (byFacility[id] || []).slice() };
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

  function defaultRoleFacilities() {
    return {
      "area-tech": ["fac-west", "fac-medical"],
      "area-supv": ["fac-bh-mesa", "fac-medical"],
      "area-tech-srna": ["fac-west"],
      "house-supv": ["fac-bh-mesa", "fac-west"],
      "ident-access": ["fac-medical"],
      "instructor": ["fac-ch-centers", "fac-medical"],
      "logistics": ["fac-west", "fac-ch-centers"],
      "ma": ["fac-bh-mesa", "fac-ch-centers"],
      "pharmacist": ["fac-ch-centers", "fac-medical"],
      "resp-ther": ["fac-bh-mesa", "fac-medical"],
      "rn-supv": ["fac-bh-mesa", "fac-medical"],
      "rnpa": ["fac-bh-mesa"],
      "rn": ["fac-bh-mesa", "fac-ch-centers", "fac-medical"],
      "tech": ["fac-west"],
      "tech-specialty": ["fac-west", "fac-medical"],
      "pharm-tech": ["fac-ch-centers"],
      "system-admin": ["fac-bh-mesa", "fac-ch-centers", "fac-west", "fac-medical"]
    };
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
      var facRoles = roles.filter(function (r) {
        return (r.facilityIds || []).indexOf(fac.id) >= 0;
      });
      var picked = facRoles[i % facRoles.length] || roles[0];
      var roleId = picked.id;
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
        assignedAreaIds: (picked.areaIds || []).slice(0, 3),
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

  function rolesForFacility(facilityId) {
    if (!facilityId) return [];
    return (state.db.roles || []).filter(function (r) {
      return (r.facilityIds || []).indexOf(facilityId) >= 0;
    });
  }

  function areasForSelectedRoles(draft) {
    var seen = {};
    var selected = (draft.extraRoleIds || []).slice();
    if (draft.roleId && selected.indexOf(draft.roleId) < 0) selected.push(draft.roleId);
    selected.forEach(function (rid) {
      var role = roleById(rid);
      if (!role) return;
      (role.areaIds || []).forEach(function (id) { seen[id] = true; });
    });
    return Object.keys(seen);
  }

  function constrainDraftToFacility(draft) {
    var allowedRoles = rolesForFacility(draft.facilityId);
    var allowedIds = allowedRoles.map(function (r) { return r.id; });
    draft.extraRoleIds = (draft.extraRoleIds || []).filter(function (id) {
      return allowedIds.indexOf(id) >= 0;
    });
    if (!draft.roleId || allowedIds.indexOf(draft.roleId) < 0) {
      draft.roleId = draft.extraRoleIds[0] || "";
    }
    if (draft.roleId && draft.extraRoleIds.indexOf(draft.roleId) < 0) {
      draft.extraRoleIds.push(draft.roleId);
    }
    var areaAllowed = areasForSelectedRoles(draft);
    draft.assignedAreaIds = (draft.assignedAreaIds || []).filter(function (id) {
      return areaAllowed.indexOf(id) >= 0;
    });
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
        } else if (k === "checked" || k === "selected") {
          if (props[k]) node.setAttribute(k, k);
        } else if (props[k] != null && props[k] !== false) node.setAttribute(k, props[k]);
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

  function menuItem(label, onClick, id) {
    return el("div", {
      className: "mi",
      id: id || undefined,
      onClick: function (ev) {
        ev.stopPropagation();
        state.openMenu = null;
        onClick();
      }
    }, [label]);
  }

  function shellHeader(active) {
    function toggle(name, ev) {
      ev.preventDefault();
      ev.stopPropagation();
      state.openMenu = state.openMenu === name ? null : name;
      render();
    }
    return el("div", { id: "app-shell" }, [
      el("header", { className: "pyxis-top" }, [
        el("div", { className: "brand", text: PRODUCT_TITLE }),
        el("nav", {}, [
          linkNav("home", "Home", active),
          linkNav("medications", "Medications", active),
          linkNav("medinventory", "Med Inventory", active),
          linkNav("reports", "Reports", active),
          linkNav("actions", "Actions", active),
          el("div", { className: "nav-drop" + (state.openMenu === "settings" ? " open" : ""), id: "nav-settings" }, [
            el("a", {
              href: "#/settings",
              className: active === "settings" ? "active" : "",
              text: "Settings",
              onClick: function (ev) { toggle("settings", ev); }
            }),
            el("div", { className: "nav-menu" }, [
              menuItem("Clinics", function () { navigate("operations"); }),
              menuItem("Devices", function () { navigate("medications"); }),
              menuItem("Dispensing", function () { navigate("medications"); }),
              menuItem("Inventory", function () { navigate("medinventory"); }),
              menuItem("Kit Components", function () { navigate("medinventory"); }),
              menuItem("Med Storage", function () { navigate("medinventory"); }),
              menuItem("Pharmacy", function () { navigate("medications"); }),
              menuItem("Reports", function () { navigate("reports"); }),
              el("div", { className: "mi has-sub open-sub" }, [
                document.createTextNode("Users"),
                el("div", { className: "nav-flyout", id: "settings-users-flyout" }, [
                  menuItem("Create User", function () {
                    state.userDraft = emptyUserDraft();
                    navigate("users", "new");
                  }, "action-create-user"),
                  menuItem("Security Groups", function () { navigate("roles"); }),
                  menuItem("User Accounts", function () { navigate("users"); }, "menu-user-accounts"),
                  menuItem("User Roles", function () { navigate("roles"); }, "menu-user-roles"),
                  menuItem("User Types", function () { navigate("roles"); })
                ])
              ])
            ])
          ]),
          linkNav("operations", "Operations", active)
        ]),
        el("div", { className: "session" }, [
          el("div", { className: "session-links" }, [
            document.createTextNode("ControlCenter...  "),
            el("a", { href: "#/home", text: "Help", onClick: function (ev) { ev.preventDefault(); state.openMenu = null; navigate("home"); } }),
            document.createTextNode(" | "),
            el("a", { href: "#/home", text: "About", onClick: function (ev) { ev.preventDefault(); state.openMenu = null; navigate("home"); } }),
            document.createTextNode(" | "),
            el("a", {
              href: "#/login",
              text: "Sign Out",
              onClick: function (ev) {
                ev.preventDefault();
                state.session = null;
                state.openMenu = null;
                saveSession(null);
                navigate("login");
              }
            })
          ]),
          el("div", { className: "session-tz", text: "Mountain Standard Time" })
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
        state.openMenu = null;
        navigate(name);
      }
    });
  }

  function wrapMain(shell, subhead, content, home) {
    var workspace = el("div", { className: "workspace" });
    if (subhead) workspace.appendChild(subhead);
    var mc = el("div", { id: "main-content", className: home ? "home-main" : "" });
    mc.appendChild(content);
    workspace.appendChild(mc);
    shell.appendChild(workspace);
    return shell;
  }

  function renderHome() {
    return el("div", { className: "welcome-panel" }, [
      el("p", { className: "welcome-lead", text: "Welcome to " + PRODUCT_TITLE + " where you can access the following features to:" }),
      el("ul", {}, [
        el("li", { text: "Medications — Pharmacy and facility formulary items, facility item approval, stock, expiration, and related tasks." }),
        el("li", { text: "Med Inventory — View or request medication, dispense or receive items, and track inventory." }),
        el("li", { text: "Reports — Standard and custom reports." }),
        el("li", { text: "Actions — Change a user password and other user-management tasks." }),
        el("li", { text: "Settings — User list, support, and configuration." }),
        el("li", { text: "Database — Software and firmware update management and device monitoring." })
      ]),
      el("div", { className: "welcome-hint", text: "Select an option from the menu below to proceed." })
    ]);
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
      tbody.appendChild(el("tr", { className: state.selectedUserId === u.id ? "selected" : "" }, [
        el("td", {}, [el("input", {
          type: "checkbox",
          checked: state.selectedUserId === u.id,
          onChange: function () { state.selectedUserId = u.id; render(); }
        })]),
        el("td", {}, [
          el("a", {
            href: "#/users/" + encodeURIComponent(u.id),
            text: u.userId,
            onClick: function (ev) { ev.preventDefault(); navigate("users", u.id); }
          })
        ]),
        el("td", { text: u.lastName || "" }),
        el("td", { text: u.firstName || "" }),
        el("td", { text: u.jobTitle || "" }),
        el("td", { text: u.employee || "Yes" }),
        el("td", { text: u.location || "" }),
        el("td", { text: u.startDate || "" }),
        el("td", { text: fac ? fac.name : "" }),
        el("td", { text: u.domain || "No" })
      ]));
    });

    var facilityOptions = [el("option", { value: "", text: "All" })];
    state.db.facilities.forEach(function (f) {
      facilityOptions.push(el("option", { value: f.id, text: f.name, selected: facilityFilter === f.id ? "selected" : null }));
    });

    function openSelected() {
      if (!state.selectedUserId) {
        alert("Select a user first.");
        return;
      }
      navigate("users", state.selectedUserId);
    }

    return el("div", { className: "accounts-page" }, [
      el("div", { className: "toolbar" }, [
        el("label", { text: "Facility " }),
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
          placeholder: "Search list",
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
          text: "Filter options",
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
          text: "Add User",
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
              el("th", { text: "User ID" }),
              el("th", { text: "Last Name" }),
              el("th", { text: "First Name" }),
              el("th", { text: "Job Title" }),
              el("th", { text: "Employee" }),
              el("th", { text: "Location" }),
              el("th", { text: "Start Date" }),
              el("th", { text: "Facility" }),
              el("th", { text: "Domain" })
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
        el("button", { className: "btn", type: "button", text: "View Details", onClick: openSelected }),
        el("button", { className: "btn", type: "button", text: "Edit User", onClick: openSelected }),
        el("button", { className: "btn", type: "button", text: "Assign Roles", onClick: openSelected }),
        el("button", {
          className: "btn",
          type: "button",
          text: "Add User",
          onClick: function () {
            state.userDraft = emptyUserDraft();
            navigate("users", "new");
          }
        })
      ])
    ]);
  }

  function renderUserForm(user) {
    var isNew = !user.id;
    var draft = state.userDraft || user;
    if (!draft.extraRoleIds) draft.extraRoleIds = [];
    constrainDraftToFacility(draft);
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

    var facilityRoles = rolesForFacility(draft.facilityId);
    var roleOptions = facilityRoles.map(function (r) {
      return el("option", { value: r.id, text: r.name, selected: draft.roleId === r.id ? "selected" : null });
    });
    if (!roleOptions.length) {
      roleOptions = [el("option", { value: "", text: "Select a facility first" })];
    }
    var facOptions = state.db.facilities.map(function (f) {
      return el("option", { value: f.id, text: f.name, selected: draft.facilityId === f.id ? "selected" : null });
    });

    var allowed = areasForSelectedRoles(draft);
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
        el("h3", { text: "Access" }),
        el("div", { className: "facility-row" }, [
          el("label", { text: "Select Facility:" }),
          el("select", {
            id: "field-facility",
            onChange: function (e) {
              draft.facilityId = e.target.value;
              draft.extraRoleIds = [];
              draft.roleId = "";
              draft.assignedAreaIds = [];
              constrainDraftToFacility(draft);
              render();
            }
          }, [el("option", { value: "", text: "Select a facility" })].concat(facOptions))
        ]),
        el("div", { className: "split-access" }, [
          el("div", { className: "split-col" }, [
            el("div", { className: "split-title", text: "Assign Roles:" }),
            el("div", { className: "areas-toolbar" }, [
              el("a", { text: "Select All", onClick: function (ev) {
                ev.preventDefault();
                draft.extraRoleIds = facilityRoles.map(function (r) { return r.id; });
                if (!draft.roleId && facilityRoles[0]) draft.roleId = facilityRoles[0].id;
                render();
              } }),
              el("a", { text: "Select None", onClick: function (ev) {
                ev.preventDefault();
                draft.extraRoleIds = [];
                render();
              } })
            ]),
            el("div", { className: "areas-panel", id: "assign-roles-panel" }, facilityRoles.length ? facilityRoles.map(function (r) {
              var checked = draft.roleId === r.id || draft.extraRoleIds.indexOf(r.id) >= 0;
              return el("label", {}, [
                el("input", {
                  type: "checkbox",
                  checked: checked,
                  onChange: function (ev) {
                    if (ev.target.checked) {
                      if (draft.extraRoleIds.indexOf(r.id) < 0) draft.extraRoleIds.push(r.id);
                      if (!draft.roleId) draft.roleId = r.id;
                    } else {
                      draft.extraRoleIds = draft.extraRoleIds.filter(function (x) { return x !== r.id; });
                      if (draft.roleId === r.id) draft.roleId = draft.extraRoleIds[0] || "";
                    }
                    render();
                  }
                }),
                " " + r.name
              ]);
            }) : [el("p", { className: "areas-empty", text: "Select a facility to see roles for that facility." })])
          ]),
          el("div", { className: "split-col" }, [
            el("div", { className: "split-title", text: "Assign Areas:" }),
            el("div", { className: "areas-toolbar" }, [
              el("a", { text: "Select All", onClick: function (ev) {
                ev.preventDefault();
                draft.assignedAreaIds = allowed.slice();
                render();
              } }),
              el("a", { text: "Select None", onClick: function (ev) {
                ev.preventDefault();
                draft.assignedAreaIds = [];
                render();
              } })
            ]),
            el("div", { className: "areas-panel", id: "assigned-areas-panel" }, areaLabels.length ? areaLabels : [
              el("p", { className: "areas-empty", text: "Select a role to see areas for that facility." })
            ])
          ])
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
            var copy = {
              id: slug,
              name: draft.name.trim(),
              areaIds: draft.areaIds.slice(),
              facilityIds: (draft.facilityIds && draft.facilityIds.length)
                ? draft.facilityIds.slice()
                : state.db.facilities.map(function (f) { return f.id; })
            };
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

    var home = false;
    if (state.route.name === "home" || state.route.name === "actions") {
      home = true;
      title = "";
      crumb = "";
      body = renderHome();
    } else if (state.route.name === "users") {
      crumb = "Home > Users > User Accounts";
      if (state.route.id === "new") {
        title = "Add User";
        crumb = "Settings > Users > User Accounts > Add User";
        body = renderUserForm(emptyUserDraft());
      } else if (state.route.id) {
        var u = state.db.users.find(function (x) { return x.id === state.route.id; });
        if (!u) {
          body = el("p", { text: "User not found." });
          title = "Users";
        } else {
          title = displayName(u);
          crumb = "Settings > Users > User Accounts > Edit User";
          if (!state.userDraft || state.userDraft.id !== u.id) state.userDraft = JSON.parse(JSON.stringify(u));
          body = renderUserForm(u);
        }
      } else {
        title = "User Accounts";
        body = renderUsersList();
      }
    } else if (state.route.name === "roles") {
      crumb = "Settings > Users > User Roles";
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
        title = "User Roles";
        body = renderRolesList();
      }
    } else if (STUB_ROUTES[state.route.name]) {
      title = STUB_ROUTES[state.route.name];
      crumb = "Home > " + title;
      body = el("div", { className: "welcome-panel" }, [
        el("p", { text: title + " is available from the top menu. User accounts and roles are under Actions or Settings." })
      ]);
    } else {
      title = "Not found";
      crumb = "Home";
      body = el("p", { text: "That page is not available." });
    }

    var sub = null;
    if (!home) {
      sub = el("div", { className: "subhead" }, [
        el("div", { className: "breadcrumb", text: crumb }),
        el("div", { className: "page-heading", text: title })
      ]);
    }

    wrapMain(shell, sub, body, home);
    root.appendChild(shell);

    if (state.toast) {
      root.appendChild(el("div", { className: "toast", text: state.toast }));
    }
  }

  function applyFacilityRoleMap(db) {
    var map = defaultRoleFacilities();
    var changed = false;
    (db.roles || []).forEach(function (r) {
      var ids = map[r.id];
      if (!ids) return;
      var current = (r.facilityIds || []).join(",");
      if (current !== ids.join(",")) {
        r.facilityIds = ids.slice();
        changed = true;
      }
    });
    return changed;
  }

  function boot() {
    var loaded = loadServerDb();
    if (!loaded || dbNeedsReseed(loaded)) {
      state.db = defaultDb();
      saveDb(state.db);
    } else {
      state.db = loaded;
      if (applyFacilityRoleMap(state.db)) saveDb(state.db);
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