const firebaseEnabled = () =>
  typeof window !== "undefined" &&
  typeof window.firebase !== "undefined" &&
  typeof window.firebase.auth === "function" &&
  typeof window.firebase.firestore === "function";

const getFirebaseAuth = () => {
  if (!firebaseEnabled()) return null;
  return window.firebase.auth();
};

class MarathonTrainingCalendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.workouts = {};
    this.completedDays = [];
    this.marathonDate = null;

    // Race configuration
    this.raceConfig = {
      type: "marathon", // 'marathon' or 'half-marathon'
      date: null,
      name: "",
    };

    this.init();
  }

  async init() {
    const calendarElement = document.getElementById("calendar");
    if (!calendarElement) {
      return;
    }

    // Load data first
    this.workouts = await this.loadWorkouts();
    this.completedDays = this.loadCompletedDays();

    // If no workouts exist, generate training plan
    if (Object.keys(this.workouts).length === 0) {
      this.generateTrainingPlan();
    }

    this.renderCalendar();
    this.setupEventListeners();
    this.renderTrainingSummary();
    this.setupWorkoutInfoDrawer();
    this.setupNavbarLinks();
    this.setupModeToggle();
    this.setupMobileDayView();
    this.setupProfileInfo();
    this.setupAutoPopulate();
    this.setupRaceConfiguration();
  }

  setupEventListeners() {
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");
    const closeModalBtn = document.getElementById("close-modal");
    const saveWorkoutBtn = document.getElementById("save-workout");
    const markCompleteBtn = document.getElementById("mark-complete");
    const deleteWorkoutBtn = document.getElementById("delete-workout");
    const dayModal = document.getElementById("day-modal");

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }

    if (saveWorkoutBtn) {
      saveWorkoutBtn.addEventListener("click", async () => {
        await this.saveWorkout();
      });
    }

    if (markCompleteBtn) {
      markCompleteBtn.addEventListener("click", async () => {
        await this.toggleComplete();
      });
    }

    if (deleteWorkoutBtn) {
      deleteWorkoutBtn.addEventListener("click", async () => {
        await this.deleteWorkout();
      });
    }

    if (dayModal) {
      dayModal.addEventListener("click", (e) => {
        if (e.target.id === "day-modal") {
          this.closeModal();
        }
      });
    }
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
    if (!heightInput || !weightInput || !bmiInput) {
      return;
    }
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
        "weight-history-header",
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
        workout.type,
      )}<br>
        <b>Distance:</b> ${workout.distance || "-"}<br>
        <b>Pace:</b> ${workout.pace || "-"}<br>
        <b>Duration:</b> ${workout.duration || "-"}<br>
        <b>Heart Rate:</b> ${workout.heartRate || "-"}<br>
        <b>Calories:</b> ${workout.calories || "-"}<br>
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
    if (!calendar) {
      return;
    }
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
      if (
        this.marathonDate &&
        currentDayDate.toDateString() === this.marathonDate.toDateString()
      ) {
        dayElement.classList.add("marathon-date");
      }

      // Check if day is completed
      if (this.completedDays.includes(dateKey)) {
        dayElement.classList.add("completed");
      }

      // Get workout for this day
      const workout = this.workouts[dateKey];
      const isMarathonDate =
        !!this.marathonDate &&
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
      },
    );

    document.getElementById("workout-type").value = workout.type || "";
    document.getElementById("workout-distance").value = workout.distance || "";
    document.getElementById("workout-pace").value = workout.pace || "";
    document.getElementById("workout-duration").value = workout.duration || "";
    document.getElementById("workout-heart-rate").value =
      workout.heartRate || "";
    document.getElementById("workout-calories").value = workout.calories || "";
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

  async saveWorkout() {
    if (!this.selectedDate) return;

    const dateKey = this.getDateKey(this.selectedDate);
    const type = document.getElementById("workout-type").value;
    const distance = document.getElementById("workout-distance").value;
    const pace = document.getElementById("workout-pace").value;
    const duration = document.getElementById("workout-duration").value;
    const heartRate = document.getElementById("workout-heart-rate").value;
    const calories = document.getElementById("workout-calories").value;
    const notes = document.getElementById("workout-notes").value;

    if (
      type ||
      distance ||
      pace ||
      duration ||
      heartRate ||
      calories ||
      notes
    ) {
      this.workouts[dateKey] = {
        type,
        distance,
        pace,
        duration,
        heartRate,
        calories,
        notes,
      };
    } else {
      delete this.workouts[dateKey];
    }

    await this.saveWorkouts();
    this.renderCalendar();
    this.renderTrainingSummary();
    this.closeModal();
  }

  async toggleComplete() {
    if (!this.selectedDate) return;

    const dateKey = this.getDateKey(this.selectedDate);
    const index = this.completedDays.indexOf(dateKey);

    if (index > -1) {
      this.completedDays.splice(index, 1);
    } else {
      this.completedDays.push(dateKey);
    }

    await this.saveCompletedDays();
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

  async deleteWorkout() {
    if (!this.selectedDate) return;

    const dateKey = this.getDateKey(this.selectedDate);
    delete this.workouts[dateKey];

    // Also remove from completed days
    const index = this.completedDays.indexOf(dateKey);
    if (index > -1) {
      this.completedDays.splice(index, 1);
    }

    await this.saveWorkouts();
    await this.saveCompletedDays();
    this.renderCalendar();
    this.renderTrainingSummary();
    this.closeModal();
  }

  generateTrainingPlan() {
    if (!this.raceConfig.date) {
      alert("Please configure your race first!");
      return;
    }

    // Clear existing workouts first
    this.workouts = {};

    const today = new Date();
    const raceDate = new Date(this.raceConfig.date);

    // Check if race is in the future
    if (raceDate <= today) {
      alert("Race date must be in the future!");
      return;
    }

    // Determine if we're in simple or complex mode
    const isSimpleMode = !document.getElementById("mode-toggle").checked;

    // Get workout types based on mode
    const workoutTypes = this.getWorkoutTypesByMode(isSimpleMode);

    // Generate weekly patterns
    const weeklyPatterns = this.generateWeeklyPatterns(
      workoutTypes,
      isSimpleMode,
    );

    let currentDate = new Date(today);
    let weekCount = 0;

    while (currentDate < raceDate) {
      const dateKey = this.getDateKey(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get the weekly pattern (cycle through patterns)
      const weekPattern = weeklyPatterns[weekCount % weeklyPatterns.length];
      const workoutType = weekPattern[dayOfWeek];

      this.workouts[dateKey] = {
        type: workoutType,
        distance: this.getDefaultDistance(workoutType, this.raceConfig.type),
        pace: this.getDefaultPace(workoutType),
        duration: this.getDefaultDuration(workoutType),
        heartRate: this.getDefaultHeartRate(workoutType),
        calories: this.getDefaultCalories(workoutType),
        notes: this.getDefaultNotes(workoutType),
      };

      // Move to next day and check if we completed a week
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() === 1) {
        // Monday - new week
        weekCount++;
      }
    }

    // Set the race day workout
    const raceDateKey = this.getDateKey(raceDate);
    const raceDistance =
      this.raceConfig.type === "marathon" ? "26.2 miles" : "13.1 miles";
    const raceType =
      this.raceConfig.type === "marathon" ? "marathon" : "half-marathon";
    const raceName =
      this.raceConfig.name ||
      (this.raceConfig.type === "marathon" ? "Marathon" : "Half Marathon");

    this.workouts[raceDateKey] = {
      type: raceType,
      distance: raceDistance,
      pace: "Race pace",
      duration:
        this.raceConfig.type === "marathon" ? "3-5 hours" : "1.5-3 hours",
      heartRate: "Zone 4 (80-90% max)",
      calories: this.raceConfig.type === "marathon" ? "2000-3000" : "1000-1500",
      notes: `� ${raceName.toUpperCase()} DAY! Good luck and have fun! Remember to pace yourself and enjoy the experience.`,
    };

    this.saveWorkouts();
  }

  getWorkoutTypesByMode(isSimpleMode) {
    if (isSimpleMode) {
      return {
        easy: "easy",
        long: "longruns",
        strength: "strength",
        rest: "rest",
        moderate: "zone2",
      };
    } else {
      return {
        easy: "easy",
        zone2: "zone2",
        vo2max: "vo2max",
        steadystate: "steadystate",
        progressive: "progressive",
        strides: "strides",
        hillsprints: "hillsprints",
        longruns: "longruns",
        strength: "strength",
        rest: "rest",
      };
    }
  }

  generateWeeklyPatterns(workoutTypes, isSimpleMode) {
    if (isSimpleMode) {
      return [
        // Simple Week 1: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
        [
          workoutTypes.long,
          workoutTypes.rest,
          workoutTypes.easy,
          workoutTypes.moderate,
          workoutTypes.easy,
          workoutTypes.strength,
          workoutTypes.easy,
        ],
        // Simple Week 2
        [
          workoutTypes.long,
          workoutTypes.easy,
          workoutTypes.rest,
          workoutTypes.moderate,
          workoutTypes.strength,
          workoutTypes.easy,
          workoutTypes.moderate,
        ],
        // Simple Week 3
        [
          workoutTypes.long,
          workoutTypes.moderate,
          workoutTypes.easy,
          workoutTypes.rest,
          workoutTypes.easy,
          workoutTypes.moderate,
          workoutTypes.strength,
        ],
        // Simple Week 4 (Recovery)
        [
          workoutTypes.long,
          workoutTypes.rest,
          workoutTypes.easy,
          workoutTypes.easy,
          workoutTypes.easy,
          workoutTypes.strength,
          workoutTypes.easy,
        ],
      ];
    } else {
      return [
        // Complex Week 1: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
        [
          workoutTypes.longruns,
          workoutTypes.rest,
          workoutTypes.zone2,
          workoutTypes.vo2max,
          workoutTypes.easy,
          workoutTypes.strength,
          workoutTypes.steadystate,
        ],
        // Complex Week 2
        [
          workoutTypes.progressive,
          workoutTypes.easy,
          workoutTypes.rest,
          workoutTypes.hillsprints,
          workoutTypes.zone2,
          workoutTypes.strength,
          workoutTypes.strides,
        ],
        // Complex Week 3
        [
          workoutTypes.longruns,
          workoutTypes.steadystate,
          workoutTypes.zone2,
          workoutTypes.rest,
          workoutTypes.vo2max,
          workoutTypes.easy,
          workoutTypes.strength,
        ],
        // Complex Week 4 (Recovery)
        [
          workoutTypes.longruns,
          workoutTypes.rest,
          workoutTypes.easy,
          workoutTypes.zone2,
          workoutTypes.easy,
          workoutTypes.strength,
          workoutTypes.easy,
        ],
      ];
    }
  }

  getDefaultDistance(type, raceType = "marathon") {
    const isHalfMarathon = raceType === "half-marathon";

    const distances = {
      vo2max: isHalfMarathon ? "3-5 miles" : "4-6 miles",
      steadystate: isHalfMarathon ? "4-6 miles" : "6-8 miles",
      progressive: isHalfMarathon ? "6-10 miles" : "8-12 miles",
      strides: "3-4 miles",
      hillsprints: "3-5 miles",
      longruns: isHalfMarathon ? "8-12 miles" : "10-16 miles",
      zone2: isHalfMarathon ? "4-6 miles" : "5-8 miles",
      strength: "N/A",
      easy: "3-6 miles",
      rest: "N/A",
      "half-marathon": "13.1 miles",
      marathon: "26.2 miles",
    };
    return distances[type] || "";
  }

  getDefaultPace(type) {
    const paces = {
      vo2max: "5K-10K pace",
      steadystate: "Marathon pace +30s",
      progressive: "Start easy, finish strong",
      strides: "Build to 5K pace",
      hillsprints: "Hard effort",
      longruns: "Conversational pace",
      zone2: "Easy/comfortable",
      strength: "N/A",
      easy: "Conversational",
      rest: "N/A",
    };
    return paces[type] || "";
  }

  getDefaultDuration(type) {
    const durations = {
      vo2max: "30-45 min",
      steadystate: "45-60 min",
      progressive: "60-90 min",
      strides: "30-40 min",
      hillsprints: "30-45 min",
      longruns: "1.5-2+ hours",
      zone2: "45-60 min",
      strength: "45-60 min",
      easy: "30-45 min",
      rest: "N/A",
    };
    return durations[type] || "";
  }

  getDefaultHeartRate(type) {
    const heartRates = {
      vo2max: "Zone 5 (90-100% max)",
      steadystate: "Zone 4 (80-90% max)",
      progressive: "Zone 2-4 (60-90% max)",
      strides: "Zone 4-5 (80-100% max)",
      hillsprints: "Zone 5 (90-100% max)",
      longruns: "Zone 2 (60-70% max)",
      zone2: "Zone 2 (60-70% max)",
      strength: "Zone 2-3 (60-80% max)",
      easy: "Zone 1-2 (50-70% max)",
      rest: "N/A",
    };
    return heartRates[type] || "";
  }

  getDefaultCalories(type) {
    const calories = {
      vo2max: "300-500",
      steadystate: "500-700",
      progressive: "600-900",
      strides: "250-400",
      hillsprints: "300-450",
      longruns: "800-1200",
      zone2: "400-600",
      strength: "200-400",
      easy: "250-500",
      rest: "N/A",
    };
    return calories[type] || "";
  }

  getDefaultNotes(type) {
    const notes = {
      vo2max: "Short intervals at high intensity to improve max oxygen uptake",
      steadystate: "Sustained tempo effort to build race fitness",
      progressive: "Start easy and gradually increase pace throughout the run",
      strides: "Include 6-8 strides after easy running to work on form",
      hillsprints: "Short hill repeats for power and strength",
      longruns: "Build aerobic base and mental toughness",
      zone2: "Easy conversational pace for active recovery",
      strength: "Focus on runner-specific exercises and core work",
      easy: "Recovery run at comfortable effort",
      rest: "Complete rest or light cross-training",
    };
    return notes[type] || "";
  }

  setupAutoPopulate() {
    const autoPopulateBtn = document.getElementById("auto-populate-btn");
    const clearWorkoutsBtn = document.getElementById("clear-workouts-btn");

    if (autoPopulateBtn) {
      autoPopulateBtn.onclick = async () => {
        if (!this.raceConfig.date) {
          alert("Please configure your race first!");
          return;
        }

        const raceTypeText =
          this.raceConfig.type === "marathon" ? "marathon" : "half marathon";
        const raceName = this.raceConfig.name || raceTypeText;
        const weeksUntilRace = Math.ceil(
          (this.raceConfig.date - new Date()) / (7 * 24 * 60 * 60 * 1000),
        );

        if (
          confirm(
            `This will replace all existing workouts with a ${weeksUntilRace}-week training plan for your ${raceName}. Continue?`,
          )
        ) {
          this.generateTrainingPlan();
          await this.saveWorkouts(); // Ensure data is saved to Firebase
          this.renderCalendar();
          this.renderTrainingSummary();

          const modeText = document.getElementById("mode-toggle").checked
            ? "complex"
            : "simple";
          alert(
            `${weeksUntilRace}-week ${modeText} training plan generated! Each week includes long runs, rest days, strength training, and varied workouts.`,
          );
        }
      };
    }

    if (clearWorkoutsBtn) {
      clearWorkoutsBtn.onclick = async () => {
        if (confirm("This will delete all workouts. Are you sure?")) {
          this.workouts = {};
          this.completedDays = [];
          await this.saveWorkouts();
          await this.saveCompletedDays();
          this.renderCalendar();
          this.renderTrainingSummary();
          alert("All workouts cleared!");
        }
      };
    }
  }

  setupRaceConfiguration() {
    const raceConfigSection = document.getElementById("race-config-section");
    const saveRaceConfigBtn = document.getElementById("save-race-config");
    const raceTypeSelect = document.getElementById("race-type");
    const raceDateInput = document.getElementById("race-date");
    const raceNameInput = document.getElementById("race-name");
    const autoPopulateBtn = document.getElementById("auto-populate-btn");
    const populateInstructions = document.getElementById(
      "populate-instructions",
    );

    // Load saved race config
    this.loadRaceConfig();

    saveRaceConfigBtn.onclick = () => {
      const raceDate = new Date(raceDateInput.value);
      const today = new Date();

      if (!raceDateInput.value) {
        alert("Please select a race date");
        return;
      }

      if (raceDate <= today) {
        alert("Race date must be in the future");
        return;
      }

      this.raceConfig = {
        type: raceTypeSelect.value,
        date: raceDate,
        name: raceNameInput.value || "",
      };

      this.saveRaceConfig();
      this.updateRaceDisplay();
      this.updateAutoPopulateButton();

      alert(
        "Race configuration saved! You can now generate your training plan.",
      );
    };

    // Update display when inputs change
    [raceTypeSelect, raceDateInput, raceNameInput].forEach((input) => {
      input.addEventListener("change", () => {
        if (raceDateInput.value) {
          this.updateRaceDisplay(true); // preview mode
        }
      });
    });
  }

  updateRaceDisplay(preview = false) {
    const raceDisplay = document.getElementById("race-display");
    const raceTypeSelect = document.getElementById("race-type");
    const raceDateInput = document.getElementById("race-date");
    const raceNameInput = document.getElementById("race-name");

    let config = this.raceConfig;
    if (preview && raceDateInput.value) {
      config = {
        type: raceTypeSelect.value,
        date: new Date(raceDateInput.value),
        name: raceNameInput.value || "",
      };
    }

    if (!config.date) {
      raceDisplay.textContent = "No race configured";
      raceDisplay.style.color = "#999";
      return;
    }

    const raceTypeText =
      config.type === "marathon"
        ? "Full Marathon (26.2 miles)"
        : "Half Marathon (13.1 miles)";
    const raceDateText = config.date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const raceName = config.name ? `${config.name} - ` : "";
    raceDisplay.innerHTML = `🏁 ${raceName}${raceTypeText}<br>📅 ${raceDateText}`;
    raceDisplay.style.color = "#667eea";
  }

  updateAutoPopulateButton() {
    const autoPopulateBtn = document.getElementById("auto-populate-btn");
    const populateInstructions = document.getElementById(
      "populate-instructions",
    );

    if (this.raceConfig.date) {
      autoPopulateBtn.disabled = false;
      autoPopulateBtn.style.opacity = "1";
      autoPopulateBtn.style.cursor = "pointer";

      const weeksUntilRace = Math.ceil(
        (this.raceConfig.date - new Date()) / (7 * 24 * 60 * 60 * 1000),
      );
      populateInstructions.textContent = `Generate a ${weeksUntilRace}-week training plan for your ${this.raceConfig.type === "marathon" ? "marathon" : "half marathon"}`;
    } else {
      autoPopulateBtn.disabled = true;
      autoPopulateBtn.style.opacity = "0.5";
      autoPopulateBtn.style.cursor = "not-allowed";
      populateInstructions.textContent =
        "Please configure your race first to generate a training plan";
    }
  }

  async saveRaceConfig() {
    const raceConfigData = {
      ...this.raceConfig,
      date: this.raceConfig.date ? this.raceConfig.date.toISOString() : null,
    };

    localStorage.setItem(
      "marathon-race-config",
      JSON.stringify(raceConfigData),
    );

    const auth = getFirebaseAuth();
    const user = auth ? auth.currentUser : null;
    if (user && firebaseEnabled()) {
      try {
        await window.firebase.firestore().collection("users").doc(user.uid).set(
          {
            raceConfig: raceConfigData,
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Error saving race config to Firebase:", error);
      }
    }
  }

  async loadRaceConfig() {
    const auth = getFirebaseAuth();
    const user = auth ? auth.currentUser : null;

    if (user && firebaseEnabled()) {
      try {
        const doc = await window.firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (doc.exists) {
          const data = doc.data();
          if (data.raceConfig) {
            this.raceConfig = {
              ...data.raceConfig,
              date: data.raceConfig.date
                ? new Date(data.raceConfig.date)
                : null,
            };
            this.populateRaceConfigForm();
            this.updateRaceDisplay();
            this.updateAutoPopulateButton();
            return;
          }
        }
      } catch (error) {
        console.error("Error loading race config from Firebase:", error);
      }
    }

    const saved = localStorage.getItem("marathon-race-config");
    if (saved) {
      const config = JSON.parse(saved);
      this.raceConfig = {
        ...config,
        date: config.date ? new Date(config.date) : null,
      };
      this.populateRaceConfigForm();
      this.updateRaceDisplay();
      this.updateAutoPopulateButton();
    }
  }

  populateRaceConfigForm() {
    document.getElementById("race-type").value = this.raceConfig.type;
    if (this.raceConfig.date) {
      document.getElementById("race-date").value = this.raceConfig.date
        .toISOString()
        .split("T")[0];
    }
    document.getElementById("race-name").value = this.raceConfig.name || "";
  }

  renderTrainingSummary() {
    let summaryElement = document.getElementById("training-summary");
    if (!summaryElement) {
      summaryElement = document.createElement("div");
      summaryElement.id = "training-summary";
      summaryElement.className = "training-summary";
      // Insert before footer instead of appending to body
      const footer = document.querySelector("footer");
      if (footer) {
        footer.parentNode.insertBefore(summaryElement, footer);
      } else {
        document.body.appendChild(summaryElement);
      }
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
      "0",
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

  async saveWorkouts() {
    // Save to localStorage for immediate access
    localStorage.setItem("marathon-workouts", JSON.stringify(this.workouts));

    const auth = getFirebaseAuth();
    const user = auth ? auth.currentUser : null;
    if (user && firebaseEnabled()) {
      try {
        const dataToSave = {
          workouts: this.workouts,
          completedDays: this.completedDays,
        };

        if (this.raceConfig.date) {
          dataToSave.raceConfig = {
            ...this.raceConfig,
            date: this.raceConfig.date.toISOString(),
          };
        }

        await window.firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .set(dataToSave, { merge: true });
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }
  }

  async loadWorkouts() {
    const auth = getFirebaseAuth();
    const user = auth ? auth.currentUser : null;

    if (user && firebaseEnabled()) {
      try {
        const doc = await window.firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (doc.exists) {
          const data = doc.data();
          if (data.workouts) {
            this.workouts = data.workouts;
            if (data.completedDays) {
              this.completedDays = data.completedDays;
            }
            if (data.marathonDate) {
              this.marathonDate = new Date(data.marathonDate);
            }
            return this.workouts;
          }
        }
      } catch (error) {
        console.error("Error loading from Firebase:", error);
      }
    }

    const saved = localStorage.getItem("marathon-workouts");
    return saved ? JSON.parse(saved) : {};
  }

  async saveCompletedDays() {
    localStorage.setItem(
      "marathon-completed",
      JSON.stringify(this.completedDays),
    );

    const auth = getFirebaseAuth();
    const user = auth ? auth.currentUser : null;
    if (user && firebaseEnabled()) {
      try {
        await window.firebase.firestore().collection("users").doc(user.uid).set(
          {
            completedDays: this.completedDays,
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Error saving completed days to Firebase:", error);
      }
    }
  }

  loadCompletedDays() {
    const saved = localStorage.getItem("marathon-completed");
    return saved ? JSON.parse(saved) : [];
  }
}

// Initialize the calendar when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.marathonCalendar = new MarathonTrainingCalendar();
});
document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const authMsg = document.getElementById("auth-message");
  const profileSection = document.getElementById("profile");
  const raceConfigSection = document.getElementById("race-config-section");
  const loginForm = document.getElementById("login-form");
  const userInfo = document.getElementById("user-info");

  const auth = getFirebaseAuth();

  if (!auth) {
    if (loginForm) loginForm.style.display = "none";
    if (userInfo) userInfo.style.display = "none";
    if (raceConfigSection) raceConfigSection.style.display = "block";
    if (authMsg)
      authMsg.textContent =
        "Firebase is temporarily disabled. Local-only mode is active.";
    if (profileSection) profileSection.style.display = "";
    return;
  }

  function showProfile(show) {
    if (profileSection) profileSection.style.display = show ? "" : "none";
  }

  loginBtn.onclick = async () => {
    try {
      await auth.signInWithEmailAndPassword(emailInput.value, passInput.value);
      authMsg.textContent = "Logged in!";
    } catch (e) {
      authMsg.textContent = e.message;
    }
  };
  signupBtn.onclick = async () => {
    try {
      await auth.createUserWithEmailAndPassword(
        emailInput.value,
        passInput.value,
      );
      authMsg.textContent = "Account created!";
    } catch (e) {
      authMsg.textContent = e.message;
    }
  };
  logoutBtn.onclick = async () => {
    await auth.signOut();
    authMsg.textContent = "Logged out!";
    // Clear email and password fields when logging out
    emailInput.value = "";
    passInput.value = "";
  };

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      if (loginForm) loginForm.style.display = "none";
      if (userInfo) userInfo.style.display = "block";
      const userEmail = document.getElementById("user-email");
      if (userEmail) userEmail.textContent = user.email;
      if (raceConfigSection) raceConfigSection.style.display = "block";
      showProfile(true);
      authMsg.textContent = "Logged in!";

      if (window.marathonCalendar) {
        await window.marathonCalendar.loadWorkouts();
        await window.marathonCalendar.loadRaceConfig();
        window.marathonCalendar.renderCalendar();
        window.marathonCalendar.renderTrainingSummary();
      }
    } else {
      if (loginForm) loginForm.style.display = "block";
      if (userInfo) userInfo.style.display = "none";
      if (raceConfigSection) raceConfigSection.style.display = "none";
      showProfile(false);
    }
  });
});
