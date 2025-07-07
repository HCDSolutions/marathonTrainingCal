class MarathonTrainingCalendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.workouts = this.loadWorkouts();
    this.completedDays = this.loadCompletedDays();

    // Marathon date - November 15th (Richmond Marathon)
    this.marathonDate = new Date(2025, 10, 15); // Month is 0-indexed, so 10 = November

    this.init();
    this.generateTrainingPlan();
  }

  init() {
    this.renderCalendar();
    this.setupEventListeners();
    this.renderTrainingSummary();
    this.setupWorkoutInfoDrawer();
    this.setupNavbarLinks();
    this.setupModeToggle();
    this.setupMobileDayView();
    this.setupProfileInfo();
  }

  setupEventListeners() {
    // Calendar navigation
    document.getElementById("prev-month").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    document.getElementById("next-month").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });

    // Modal events
    document.getElementById("close-modal").addEventListener("click", () => {
      this.closeModal();
    });

    document.getElementById("save-workout").addEventListener("click", () => {
      this.saveWorkout();
    });

    document.getElementById("mark-complete").addEventListener("click", () => {
      this.toggleComplete();
    });

    document.getElementById("delete-workout").addEventListener("click", () => {
      this.deleteWorkout();
    });

    // Close modal when clicking outside
    document.getElementById("day-modal").addEventListener("click", (e) => {
      if (e.target.id === "day-modal") {
        this.closeModal();
      }
    });
  }

  setupWorkoutInfoDrawer() {
    const openBtn = document.getElementById("open-workout-info");
    const drawer = document.getElementById("workout-info-drawer");
    const closeBtn = document.getElementById("close-workout-info");
    if (openBtn && drawer && closeBtn) {
      openBtn.onclick = () => {
        drawer.classList.add("open");
      };
      closeBtn.onclick = () => {
        drawer.classList.remove("open");
      };
      drawer.onclick = (e) => {
        if (e.target === drawer) drawer.classList.remove("open");
      };
    }
  }

  setupNavbarLinks() {
    const calendarSection = document.getElementById("calendar");
    const profileSection = document.getElementById("profile");
    const nutritionSection = document.getElementById("nutrition");
    const navCalendar = document.getElementById("nav-calendar");
    const navProfile = document.getElementById("nav-profile");
    const navNutrition = document.getElementById("nav-nutrition");
    // Only use SPA navigation if all three sections exist (old single-page mode)
    if (
      calendarSection &&
      profileSection &&
      nutritionSection &&
      navCalendar &&
      navProfile &&
      navNutrition
    ) {
      navCalendar.onclick = (e) => {
        e.preventDefault();
        calendarSection.scrollIntoView({ behavior: "smooth" });
        profileSection.style.display = "none";
        nutritionSection.style.display = "none";
        navCalendar.classList.add("active");
        navProfile.classList.remove("active");
        navNutrition.classList.remove("active");
      };
      navProfile.onclick = (e) => {
        e.preventDefault();
        profileSection.style.display = "block";
        nutritionSection.style.display = "none";
        window.scrollTo({
          top: profileSection.offsetTop - 60,
          behavior: "smooth",
        });
        navCalendar.classList.remove("active");
        navProfile.classList.add("active");
        navNutrition.classList.remove("active");
      };
      navNutrition.onclick = (e) => {
        e.preventDefault();
        profileSection.style.display = "none";
        nutritionSection.style.display = "block";
        window.scrollTo({
          top: nutritionSection.offsetTop - 60,
          behavior: "smooth",
        });
        navCalendar.classList.remove("active");
        navProfile.classList.remove("active");
        navNutrition.classList.add("active");
      };
    }
    // Otherwise, do nothing: links work as normal
  }

  setupModeToggle() {
    const modeToggle = document.getElementById("mode-toggle");
    const modeText = document.getElementById("mode-text");
    const workoutTypeSelect = document.getElementById("workout-type");
    const infoBadge = document.getElementById("open-workout-info");
    const drawer = document.getElementById("workout-info-drawer");
    if (!modeToggle || !modeText || !workoutTypeSelect) return;
    // Define options for both modes
    const simpleOptions = [
      {
        value: "hard",
        label: "Hard Run",
        desc: "A challenging run at high intensity.",
      },
      {
        value: "tempo",
        label: "Tempo Run",
        desc: "Comfortably hard, sustained effort.",
      },
      {
        value: "easy",
        label: "Easy Run",
        desc: "Relaxed, conversational pace.",
      },
      {
        value: "sprints",
        label: "Sprints",
        desc: "Short, fast bursts for speed.",
      },
      {
        value: "rest",
        label: "Rest Day",
        desc: "No running; focus on recovery.",
      },
      {
        value: "marathon",
        label: "Marathon Race",
        desc: "The big day! 26.2 miles.",
      },
    ];
    const complexOptions = [
      {
        value: "vo2max",
        label: "VO2 Max",
        desc: "Short, high-intensity intervals to improve aerobic capacity.",
      },
      {
        value: "steadystate",
        label: "Steady State Run",
        desc: "Sustained, comfortably hard pace to build endurance and efficiency.",
      },
      {
        value: "progressive",
        label: "Progressive Long Run",
        desc: "Long run that gradually increases in pace, finishing strong.",
      },
      {
        value: "strides",
        label: "Strides and Drills",
        desc: "Short bursts and technique drills to improve speed and running form.",
      },
      {
        value: "hillsprints",
        label: "Hill Sprints",
        desc: "Short, powerful sprints up a hill to build strength and power.",
      },
      {
        value: "longruns",
        label: "Long Runs",
        desc: "Weekly long-distance runs to build aerobic base and stamina.",
      },
      {
        value: "zone2",
        label: "Zone 2 Runs",
        desc: "Easy, conversational pace runs for aerobic development and recovery.",
      },
      {
        value: "strength",
        label: "Strength Training",
        desc: "Gym or bodyweight exercises to improve overall strength and injury resistance.",
      },
      {
        value: "rest",
        label: "Rest Day",
        desc: "No running; focus on recovery and adaptation.",
      },
      {
        value: "marathon",
        label: "Marathon Race",
        desc: "The big day! 26.2 miles at your best effort.",
      },
    ];
    // Helper to update dropdown
    function updateDropdown(isSimple) {
      workoutTypeSelect.innerHTML = "";
      const opts = isSimple ? simpleOptions : complexOptions;
      workoutTypeSelect.appendChild(new Option("Select workout type", ""));
      opts.forEach((opt) => {
        workoutTypeSelect.appendChild(new Option(opt.label, opt.value));
      });
    }
    // Helper to update info drawer
    function updateDrawer(isSimple) {
      const list = drawer.querySelector(".workout-type-list");
      list.innerHTML = "";
      const opts = isSimple ? simpleOptions : complexOptions;
      opts.forEach((opt) => {
        const li = document.createElement("li");
        li.innerHTML = `<b>${opt.label}:</b> ${opt.desc}`;
        list.appendChild(li);
      });
    }
    // Initial state
    updateDropdown(true);
    updateDrawer(true);
    modeText.textContent = "Simple";
    modeText.className = "mode-badge simple";
    // Toggle event
    modeToggle.onchange = function () {
      const isSimple = !modeToggle.checked;
      updateDropdown(isSimple);
      updateDrawer(isSimple);
      modeText.textContent = isSimple ? "Simple" : "Complex";
      modeText.className = isSimple
        ? "mode-badge simple"
        : "mode-badge complex";
    };
    // Info badge opens/closes drawer (no caret logic)
    if (infoBadge && drawer) {
      infoBadge.onclick = () => {
        const isOpen = drawer.classList.toggle("open");
        infoBadge.classList.toggle("open", isOpen);
      };
      // Also close badge when drawer is closed by outside click
      drawer.onclick = (e) => {
        if (e.target === drawer) {
          drawer.classList.remove("open");
          infoBadge.classList.remove("open");
        }
      };
    }
  }

  setupMobileDayView() {
    this.mobileDay = new Date();
    this.renderMobileDayView();
    const prevBtn = document.getElementById("mobile-prev-day");
    const nextBtn = document.getElementById("mobile-next-day");
    if (prevBtn && nextBtn) {
      prevBtn.onclick = () => {
        this.mobileDay.setDate(this.mobileDay.getDate() - 1);
        this.renderMobileDayView();
      };
      nextBtn.onclick = () => {
        this.mobileDay.setDate(this.mobileDay.getDate() + 1);
        this.renderMobileDayView();
      };
    }
  }

  setupProfileInfo() {
    // BMI calculation
    const heightInput = document.getElementById("profile-height");
    const weightInput = document.getElementById("profile-weight");
    const bmiInput = document.getElementById("profile-bmi");
    const unitToggle = document.getElementById("unit-toggle");
    const heightLabel = document.getElementById("profile-height-label");
    const weightLabel = document.getElementById("profile-weight-label");
    // Show BMI category
    let bmiCategoryLabel = document.getElementById("bmi-category-label");
    if (!bmiCategoryLabel && bmiInput) {
      bmiCategoryLabel = document.createElement("div");
      bmiCategoryLabel.id = "bmi-category-label";
      bmiInput.parentElement.appendChild(bmiCategoryLabel);
    }
    // Unit state
    let currentUnit = localStorage.getItem("profile-unit") || "imperial";
    if (unitToggle) unitToggle.value = currentUnit;
    function getBMICategory(bmi) {
      if (bmi < 18.5) return "Underweight";
      if (bmi < 25) return "Normal weight";
      if (bmi < 30) return "Overweight";
      return "Obese";
    }
    function toMetric(h, w) {
      // h: inches -> cm, w: lbs -> kg
      return [h * 2.54, w * 0.453592];
    }
    function toImperial(h, w) {
      // h: cm -> in, w: kg -> lbs
      return [h / 2.54, w / 0.453592];
    }
    function updateLabels(unit) {
      if (heightLabel)
        heightLabel.textContent =
          unit === "metric" ? "Height (cm):" : "Height (in):";
      if (weightLabel)
        weightLabel.textContent =
          unit === "metric" ? "Current Weight (kg):" : "Current Weight (lbs):";
      // Weight tracker labels
      const weightValueLabel = document.getElementById("weight-value-label");
      const weightHistoryHeader = document.getElementById(
        "weight-history-header"
      );
      if (weightValueLabel)
        weightValueLabel.textContent = `Weight (${
          unit === "metric" ? "kg" : "lbs"
        }):`;
      if (weightHistoryHeader)
        weightHistoryHeader.textContent = `Weight (${
          unit === "metric" ? "kg" : "lbs"
        })`;
    }
    function updateBMI() {
      let h = parseFloat(heightInput.value);
      let w = parseFloat(weightInput.value);
      if (h > 0 && w > 0) {
        // Convert to metric for calculation if needed
        if (currentUnit === "imperial") {
          [h, w] = toMetric(h, w);
        }
        const bmi = w / (h / 100) ** 2;
        bmiInput.value = bmi.toFixed(1);
        if (bmiCategoryLabel) {
          bmiCategoryLabel.textContent = `(${getBMICategory(bmi)})`;
          bmiCategoryLabel.style.fontSize = "0.95em";
          bmiCategoryLabel.style.color = "#764ba2";
          bmiCategoryLabel.style.marginTop = "4px";
        }
      } else {
        bmiInput.value = "";
        if (bmiCategoryLabel) bmiCategoryLabel.textContent = "";
      }
    }
    // Convert profile fields on unit change
    function convertProfileFields(newUnit) {
      let h = parseFloat(heightInput.value);
      let w = parseFloat(weightInput.value);
      if (h > 0 && w > 0) {
        if (newUnit === "metric" && currentUnit === "imperial") {
          [h, w] = toMetric(h, w);
        } else if (newUnit === "imperial" && currentUnit === "metric") {
          [h, w] = toImperial(h, w);
        }
        heightInput.value = h ? h.toFixed(1) : "";
        weightInput.value = w ? w.toFixed(1) : "";
      }
    }
    if (unitToggle && heightInput && weightInput && bmiInput) {
      unitToggle.onchange = function () {
        const newUnit = unitToggle.value;
        if (newUnit !== currentUnit) {
          convertProfileFields(newUnit);
          updateLabels(newUnit);
          currentUnit = newUnit;
          localStorage.setItem("profile-unit", currentUnit);
          updateBMI();
          // Also update weight tracker table and form
          renderWeightHistory();
        }
      };
      updateLabels(currentUnit);
    }
    if (heightInput && weightInput && bmiInput) {
      heightInput.oninput = updateBMI;
      weightInput.oninput = updateBMI;
    }
    // Weekly weight tracker
    const weightForm = document.getElementById("weight-form");
    const weightDate = document.getElementById("weight-date");
    const weightValue = document.getElementById("weight-value");
    const weightHistory = document
      .getElementById("weight-history")
      .querySelector("tbody");
    // Load from localStorage
    let weights = JSON.parse(localStorage.getItem("weight-history") || "[]");
    function renderWeightHistory() {
      weightHistory.innerHTML = "";
      weights.sort((a, b) => new Date(b.date) - new Date(a.date));
      for (const entry of weights) {
        let displayWeight = entry.weight;
        if (currentUnit === "imperial" && entry.unit === "metric") {
          displayWeight = (entry.weight / 0.453592).toFixed(1);
        } else if (currentUnit === "metric" && entry.unit === "imperial") {
          displayWeight = (entry.weight * 0.453592).toFixed(1);
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${entry.date}</td><td>${displayWeight}</td>`;
        weightHistory.appendChild(tr);
      }
      // Auto-fill weight field with latest entry (convert if needed)
      if (weights.length && weightInput) {
        let latest = weights[0];
        let w = latest.weight;
        if (currentUnit === "imperial" && latest.unit === "metric") {
          w = (w / 0.453592).toFixed(1);
        } else if (currentUnit === "metric" && latest.unit === "imperial") {
          w = (w * 0.453592).toFixed(1);
        }
        weightInput.value = w;
        updateBMI();
      }
    }
    if (weightForm && weightDate && weightValue) {
      weightForm.onsubmit = (e) => {
        e.preventDefault();
        const date = weightDate.value;
        let weight = parseFloat(weightValue.value);
        if (date && weight > 0) {
          // Store with current unit
          // Remove existing entry for this date
          weights = weights.filter((w) => w.date !== date);
          weights.push({ date, weight, unit: currentUnit });
          localStorage.setItem("weight-history", JSON.stringify(weights));
          renderWeightHistory();
          weightForm.reset();
        }
      };
      renderWeightHistory();
    }
    // On load, update labels and BMI
    updateLabels(currentUnit);
    updateBMI();
  }

  renderMobileDayView() {
    const label = document.getElementById("mobile-day-label");
    const details = document.getElementById("mobile-day-details");
    if (!label || !details) return;
    const d = this.mobileDay;
    label.textContent = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const dateKey = this.getDateKey(d);
    const workout = this.workouts[dateKey];
    if (workout) {
      details.innerHTML = `<b>Workout:</b> ${this.getWorkoutLabel(
        workout.type
      )}<br>
        <b>Distance:</b> ${workout.distance || "-"}<br>
        <b>Pace:</b> ${workout.pace || "-"}<br>
        <b>Notes:</b> ${workout.notes || "-"}<br>`;
    } else {
      details.innerHTML = "<i>No workout assigned for this day.</i>";
    }
  }

  getWorkoutLabel(type) {
    // Map type to label for both modes
    const map = {
      hard: "Hard Run",
      tempo: "Tempo Run",
      easy: "Easy Run",
      sprints: "Sprints",
      vo2max: "VO2 Max",
      steadystate: "Steady State Run",
      progressive: "Progressive Long Run",
      strides: "Strides and Drills",
      hillsprints: "Hill Sprints",
      longruns: "Long Runs",
      zone2: "Zone 2 Runs",
      strength: "Strength Training",
      rest: "Rest Day",
      marathon: "Marathon Race",
    };
    return map[type] || type;
  }

  renderCalendar() {
    const calendar = document.getElementById("calendar");
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Clear existing calendar
    calendar.innerHTML = "";

    // Create header
    const header = document.createElement("div");
    header.className = "calendar-header";
    header.innerHTML = `
            <button id="prev-month" class="nav-button">❮</button>
            <h2>${this.getMonthName(month)} ${year}</h2>
            <button id="next-month" class="nav-button">❯</button>
        `;
    calendar.appendChild(header);

    // Create grid container
    const grid = document.createElement("div");
    grid.className = "calendar-grid";
    calendar.appendChild(grid);

    // Add day headers
    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayHeaders.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "day-header";
      dayHeader.textContent = day;
      grid.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day other-month";
      grid.appendChild(emptyDay);
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";

      const currentDayDate = new Date(year, month, day);
      const dateKey = this.getDateKey(currentDayDate);

      // Check if it's today
      const today = new Date();
      if (currentDayDate.toDateString() === today.toDateString()) {
        dayElement.classList.add("today");
      }

      // Check if it's the marathon date
      if (currentDayDate.toDateString() === this.marathonDate.toDateString()) {
        dayElement.classList.add("marathon-date");
      }

      // Check if day is completed
      if (this.completedDays.includes(dateKey)) {
        dayElement.classList.add("completed");
      }

      // Get workout for this day
      const workout = this.workouts[dateKey];
      const isMarathonDate =
        currentDayDate.toDateString() === this.marathonDate.toDateString();

      dayElement.innerHTML = `
                ${isMarathonDate ? '<div class="marathon-icon">🏃‍♂️</div>' : ""}
                <div class="day-number">${day}</div>
                ${workout ? this.renderWorkoutInfo(workout) : ""}
                ${
                  isMarathonDate
                    ? '<div style="font-size: 0.7rem; font-weight: bold; margin-top: 5px;">RICHMOND MARATHON</div>'
                    : ""
                }
                <div class="completion-status">✓</div>
            `;

      dayElement.addEventListener("click", () => {
        this.openModal(currentDayDate);
      });

      grid.appendChild(dayElement);
    }

    // Re-attach event listeners for navigation
    this.setupEventListeners();
  }

  renderWorkoutInfo(workout) {
    return `
            <div class="workout-info">
                <div class="workout-type ${
                  workout.type
                }">${workout.type.toUpperCase()}</div>
                <div>${workout.distance || ""}</div>
                <div>${
                  workout.notes ? workout.notes.substring(0, 20) + "..." : ""
                }</div>
            </div>
        `;
  }

  openModal(date) {
    this.selectedDate = date;
    const dateKey = this.getDateKey(date);
    const workout = this.workouts[dateKey] || {};
    const isCompleted = this.completedDays.includes(dateKey);

    document.getElementById("modal-date").textContent = date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    document.getElementById("workout-type").value = workout.type || "";
    document.getElementById("workout-distance").value = workout.distance || "";
    document.getElementById("workout-pace").value = workout.pace || "";
    document.getElementById("workout-notes").value = workout.notes || "";

    const completeBtn = document.getElementById("mark-complete");
    completeBtn.textContent = isCompleted
      ? "Mark as Incomplete"
      : "Mark as Complete";
    completeBtn.className = isCompleted ? "btn-danger" : "btn-success";

    document.getElementById("day-modal").style.display = "block";
  }

  closeModal() {
    document.getElementById("day-modal").style.display = "none";
    this.selectedDate = null;
  }

  saveWorkout() {
    if (!this.selectedDate) return;

    const dateKey = this.getDateKey(this.selectedDate);
    const type = document.getElementById("workout-type").value;
    const distance = document.getElementById("workout-distance").value;
    const pace = document.getElementById("workout-pace").value;
    const notes = document.getElementById("workout-notes").value;

    if (type || distance || pace || notes) {
      this.workouts[dateKey] = { type, distance, pace, notes };
    } else {
      delete this.workouts[dateKey];
    }

    this.saveWorkouts();
    this.renderCalendar();
    this.renderTrainingSummary();
    this.closeModal();
  }

  toggleComplete() {
    if (!this.selectedDate) return;

    const dateKey = this.getDateKey(this.selectedDate);
    const index = this.completedDays.indexOf(dateKey);

    if (index > -1) {
      this.completedDays.splice(index, 1);
    } else {
      this.completedDays.push(dateKey);
    }

    this.saveCompletedDays();
    this.renderCalendar();
    this.renderTrainingSummary();

    // Update button text
    const isCompleted = this.completedDays.includes(dateKey);
    const completeBtn = document.getElementById("mark-complete");
    completeBtn.textContent = isCompleted
      ? "Mark as Incomplete"
      : "Mark as Complete";
    completeBtn.className = isCompleted ? "btn-danger" : "btn-success";
  }

  deleteWorkout() {
    if (!this.selectedDate) return;

    const dateKey = this.getDateKey(this.selectedDate);
    delete this.workouts[dateKey];

    // Also remove from completed days
    const index = this.completedDays.indexOf(dateKey);
    if (index > -1) {
      this.completedDays.splice(index, 1);
    }

    this.saveWorkouts();
    this.saveCompletedDays();
    this.renderCalendar();
    this.renderTrainingSummary();
    this.closeModal();
  }

  generateTrainingPlan() {
    // Assign a different workout type to each day, with Sunday as rest day, up to the marathon date
    const workoutTypes = [
      "vo2max",
      "steadystate",
      "progressive",
      "strides",
      "hillsprints",
      "longruns",
      "zone2",
      "strength",
    ];
    const start = new Date();
    const end = new Date(this.marathonDate);
    let d = new Date(start);
    let typeIdx = 0;
    while (d <= end) {
      const dateKey = this.getDateKey(d);
      // Sunday is rest day
      if (d.getDay() === 0) {
        this.workouts[dateKey] = {
          type: "rest",
          distance: "",
          pace: "",
          notes: "Rest day",
        };
      } else if (dateKey !== this.getDateKey(this.marathonDate)) {
        // Assign next workout type, skip marathon day
        const type = workoutTypes[typeIdx % workoutTypes.length];
        this.workouts[dateKey] = {
          type,
          distance: "",
          pace: "",
          notes: "",
        };
        typeIdx++;
      }
      d.setDate(d.getDate() + 1);
    }
    // Set the marathon day workout
    const marathonDateKey = this.getDateKey(this.marathonDate);
    this.workouts[marathonDateKey] = {
      type: "marathon",
      distance: "26.2 miles",
      pace: "Race pace",
      notes:
        "🏃‍♂️ RICHMOND MARATHON DAY! Good luck and have fun! Remember to pace yourself and enjoy the experience.",
    };
    this.saveWorkouts();
  }

  renderTrainingSummary() {
    let summaryElement = document.getElementById("training-summary");
    if (!summaryElement) {
      summaryElement = document.createElement("div");
      summaryElement.id = "training-summary";
      summaryElement.className = "training-summary";
      document.body.appendChild(summaryElement);
    }

    const totalWorkouts = Object.keys(this.workouts).length;
    const completedWorkouts = this.completedDays.length;
    const completionRate =
      totalWorkouts > 0
        ? Math.round((completedWorkouts / totalWorkouts) * 100)
        : 0;

    // Count workouts by type
    const workoutTypes = {};
    Object.values(this.workouts).forEach((workout) => {
      workoutTypes[workout.type] = (workoutTypes[workout.type] || 0) + 1;
    });

    summaryElement.innerHTML = `
            <h2>Training Progress</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>${completedWorkouts}</h3>
                    <p>Completed Workouts</p>
                </div>
                <div class="summary-card">
                    <h3>${totalWorkouts}</h3>
                    <p>Total Planned</p>
                </div>
                <div class="summary-card">
                    <h3>${completionRate}%</h3>
                    <p>Completion Rate</p>
                </div>
                <div class="summary-card">
                    <h3>${workoutTypes.long || 0}</h3>
                    <p>Long Runs</p>
                </div>
            </div>
        `;
  }

  getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  getMonthName(monthIndex) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthIndex];
  }

  saveWorkouts() {
    localStorage.setItem("marathon-workouts", JSON.stringify(this.workouts));
  }

  loadWorkouts() {
    const saved = localStorage.getItem("marathon-workouts");
    return saved ? JSON.parse(saved) : {};
  }

  saveCompletedDays() {
    localStorage.setItem(
      "marathon-completed",
      JSON.stringify(this.completedDays)
    );
  }

  loadCompletedDays() {
    const saved = localStorage.getItem("marathon-completed");
    return saved ? JSON.parse(saved) : [];
  }
}

// Initialize the calendar when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new MarathonTrainingCalendar();
});
