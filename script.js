// Get the main parts of the page
const plannerForm = document.getElementById("plannerForm");
const setupSection = document.getElementById("setup");
const dashboardSection = document.getElementById("dashboard");

// This object will hold all information about the Ajo group
let planner = null;

// Add commas and the Naira sign to an amount
function formatMoney(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

// Start the planner when the user submits the setup form
function startPlanner(event) {
  event.preventDefault();

  const groupName = document.getElementById("group").value.trim();
  const contributionAmount = Number(document.getElementById("amount").value);
  const membersInput = document.getElementById("members").value;

  // Change the comma-separated text into an array of names
  const members = membersInput
    .split(",")
    .map(function (name) {
      return name.trim();
    })
    .filter(function (name) {
      return name !== "";
    });

  if (members.length < 2) {
    alert("Please add at least two members.");
    return;
  }

  planner = {
    name: groupName,
    amount: contributionAmount,
    members: members,
    cycle: 0,
    paidMembers: [],
    history: []
  };

  localStorage.setItem("planner", JSON.stringify(planner));

  // Hide the setup form and show the dashboard
  setupSection.hidden = true;
  dashboardSection.hidden = false;
  displayPlanner();
}

// Update every part of the dashboard
function displayPlanner() {
  const isComplete = planner.cycle >= planner.members.length;
  const totalPot = planner.amount * planner.members.length;

  document.getElementById("dbName").textContent = planner.name;
  document.getElementById("dbsub").textContent =
    planner.members.length + " members · " + formatMoney(planner.amount) + " each cycle";

  if (isComplete) {
    document.getElementById("statCycle").textContent = "Complete";
    document.getElementById("statPaid").textContent = formatMoney(totalPot);
  } else {
    document.getElementById("statCycle").textContent =
      planner.cycle + 1 + " of " + planner.members.length;
    document.getElementById("statPaid").textContent =
      formatMoney(planner.amount * planner.paidMembers.length);
  }

  document.getElementById("statPot").textContent = formatMoney(totalPot);
  showRotationOrder();

  document.getElementById("completeBanner").hidden = !isComplete;
  document.getElementById("cycleCard").hidden = isComplete;

  // There is no active cycle after all members have received their payout
  if (isComplete) {
    return;
  }

  showCurrentCycle(totalPot);
}

// Display every member in payout order
function showRotationOrder() {
  const rotationList = document.getElementById("rotationList");
  rotationList.innerHTML = "";

  planner.members.forEach(function (member, index) {
    const memberRow = document.createElement("div");
    memberRow.className = "member";

    let status = "Upcoming";
    if (index < planner.cycle) {
      status = "Paid out";
    } else if (index === planner.cycle) {
      status = "Current recipient";
      memberRow.classList.add("current");
    }

    memberRow.innerHTML =
      "<span><b>" + (index + 1) + ".</b> " + member + "</span>" +
      "<span class='position'>" + status + "</span>";

    rotationList.appendChild(memberRow);
  });
}

// Display the checklist for the active cycle
function showCurrentCycle(totalPot) {
  document.getElementById("cycleTitle").textContent =
    "Cycle " + (planner.cycle + 1);
  document.getElementById("cyclePot").textContent = formatMoney(totalPot);
  document.getElementById("recipientName").textContent = planner.members[planner.cycle];

  const checklist = document.getElementById("checkList");
  checklist.innerHTML = "";

  planner.members.forEach(function (member, index) {
    const memberHasPaid = planner.paidMembers.includes(index);
    const row = document.createElement("label");
    row.className = "check-row";

    row.innerHTML =
      "<input type='checkbox' " +
      "onclick='updatePayment(" + index + ", this.checked)' " +
      (memberHasPaid ? "checked" : "") + ">" +
      "<span>" + member + " <small>(" + formatMoney(planner.amount) + ")</small></span>";
    checklist.appendChild(row);
  });

  updateAdvanceButton();
}

// Add or remove a member from the list of people who have paid
function updatePayment(memberIndex, hasPaid) {
  if (hasPaid) {
    planner.paidMembers.push(memberIndex);
  } else {
    planner.paidMembers = planner.paidMembers.filter(function (index) {
      return index !== memberIndex;
    });
  }

  localStorage.setItem("planner", JSON.stringify(planner));
  displayPlanner();
}

// Enable the payout button only when every member has paid
function updateAdvanceButton() {
  const advanceButton = document.getElementById("advanceBtn");
  const hint = document.getElementById("advanceHint");
  const everyoneHasPaid = planner.paidMembers.length === planner.members.length;

  advanceButton.disabled = !everyoneHasPaid;

  if (everyoneHasPaid) {
    hint.textContent = "All contributions received. You can confirm this payout.";
  } else {
    const remainingPayments = planner.members.length - planner.paidMembers.length;
    hint.textContent = remainingPayments + " contribution(s) remaining.";
  }
}

function advanceCycle() {
  const totalPot = planner.amount * planner.members.length;

  planner.history.unshift({
    recipient: planner.members[planner.cycle],
    pot: totalPot,
    cycle: planner.cycle + 1
  });

  planner.cycle++;
  planner.paidMembers = [];
  localStorage.setItem("planner", JSON.stringify(planner));
  displayPlanner();
}


function resetPlanner() {
  const shouldReset = confirm("Start a new planner?");

  if (shouldReset) {
    localStorage.removeItem("planner");
    planner = null;
    plannerForm.reset();
    dashboardSection.hidden = true;
    setupSection.hidden = false;
  }
}


const savedPlanner = localStorage.getItem("planner");

if (savedPlanner) {
  planner = JSON.parse(savedPlanner);
  setupSection.hidden = true;
  dashboardSection.hidden = false;
  displayPlanner();
}
