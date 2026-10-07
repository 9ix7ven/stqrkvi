/* =========================
   MOBILE MENU
========================= */

function toggleMenu() {

    const menu =
        document.getElementById("navLinks");

    menu.classList.toggle("open");
}


/* =========================
   PORTAL OPEN
========================= */

function openPortal() {

    document.getElementById("portalScreen")
        .classList.add("active");

    document.getElementById("loginPage")
        .style.display = "block";

    document.getElementById("dashboardPage")
        .style.display = "none";

    document.body.style.overflow = "hidden";
}


/* =========================
   PORTAL CLOSE
========================= */

function closePortal() {

    document.getElementById("portalScreen")
        .classList.remove("active");

    document.body.style.overflow = "auto";
}


/* =========================
   LOGIN
========================= */

function login(event) {

    event.preventDefault();

    const username =
        document.getElementById("username")
            .value
            .trim()
            .toLowerCase();

    const password =
        document.getElementById("password")
            .value
            .trim();

    const error =
        document.getElementById("loginError");


    const accounts = {

        "unique26": {
            password: "uniquew",
            name: "Unique",
            className: "-",
            section: "-",
            roll: "-"
        },

        "ishan26": {
            password: "ishanw",
            name: "Ishan",
            className: "-",
            section: "-",
            roll: "-"
        },

        "ishaan26": {
            password: "ishaanw",
            name: "Ishaan",
            className: "IX",
            section: "A",
            roll: "24"
        }

    };


    const student =
        accounts[username];


    if (
        student &&
        student.password === password
    ) {

        error.style.display = "none";

        window.currentStudent = student;

        updateStudentUI(student);

        document.getElementById("loginPage")
            .style.display = "none";

        document.getElementById("dashboardPage")
            .style.display = "block";

        window.scrollTo(0, 0);

    }

    else {

        error.style.display = "block";

    }
}


/* =========================
   UPDATE STUDENT UI
========================= */

function updateStudentUI(student) {

    const dashboardName =
        document.getElementById(
            "dashboardStudentName"
        );

    const dashboardClass =
        document.getElementById(
            "dashboardStudentClass"
        );

    const dashboardGreeting =
        document.getElementById(
            "dashboardGreeting"
        );

    const firstName =
        document.getElementById(
            "profileFirstName"
        );

    const classSection =
        document.getElementById(
            "profileClassSection"
        );

    const section =
        document.getElementById(
            "profileSection"
        );

    const roll =
        document.getElementById(
            "profileRoll"
        );

    const academicClass =
        document.getElementById(
            "profileAcademicClass"
        );

    const academicSection =
        document.getElementById(
            "profileAcademicSection"
        );

    const academicRoll =
        document.getElementById(
            "profileAcademicRoll"
        );


    if (dashboardName) {
        dashboardName.textContent =
            student.name;
    }

    if (dashboardClass) {

        dashboardClass.textContent =
            student.className === "-"
                ? "Student"
                : "Class " +
                  student.className;
    }

    if (dashboardGreeting) {

        dashboardGreeting.textContent =
            "Good afternoon, " +
            student.name +
            " 👋";
    }

    if (firstName) {
        firstName.textContent =
            student.name;
    }

    if (classSection) {

        classSection.textContent =
            student.className === "-"
                ? "-"
                : student.className +
                  " - " +
                  student.section;
    }

    if (section) {
        section.textContent =
            student.section;
    }

    if (roll) {
        roll.textContent =
            student.roll;
    }

    if (academicClass) {
        academicClass.textContent =
            student.className;
    }

    if (academicSection) {
        academicSection.textContent =
            student.section;
    }

    if (academicRoll) {
        academicRoll.textContent =
            student.roll;
    }
}


/* =========================
   LOGOUT
========================= */

function logout() {

    document.getElementById("dashboardPage")
        .style.display = "none";

    document.getElementById("loginPage")
        .style.display = "block";

    document.getElementById("username")
        .value = "";

    document.getElementById("password")
        .value = "";
}


/* =========================
   DASHBOARD PAGE SWITCHING
========================= */

function showDashboardPage(
    page,
    clickedElement
) {

    const pages =
        document.querySelectorAll(
            ".dashboard-page"
        );

    pages.forEach(function(item) {

        item.classList.remove("active");

    });


    const selected =
        document.getElementById(
            "page-" + page
        );


    if (selected) {

        selected.classList.add("active");

    }


    const links =
        document.querySelectorAll(
            ".side-link"
        );


    links.forEach(function(link) {

        link.classList.remove("active");

    });


    if (clickedElement) {

        clickedElement.classList.add("active");

    }


    window.scrollTo(0, 0);
}


/* =========================
   NAV ACTIVE LINK
========================= */

const navAnchors =
    document.querySelectorAll(
        ".nav-links a[href^='#']"
    );


navAnchors.forEach(function(anchor) {

    anchor.addEventListener(
        "click",
        function() {

            navAnchors.forEach(
                function(item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );

            anchor.classList.add(
                "active"
            );

            document
                .getElementById("navLinks")
                .classList.remove("open");
        }
    );

});


/* =========================
   ESC KEY
========================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            document
                .getElementById("portalScreen")
                .classList.contains("active")
        ) {

            closePortal();

        }

    }
);
