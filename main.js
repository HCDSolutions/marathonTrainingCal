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
    // Generate a 16-week marathon training plan starting from today
    const startDate = new Date();
    const weekPattern = [
      { type: "zone2", distance: "3-4 miles" },
      { type: "steadystate", distance: "4-5 miles" },
      { type: "zone2", distance: "3-4 miles" },
      { type: "vo2max", distance: "5-6 miles" },
      { type: "strides", distance: "3-4 miles" },
      { type: "rest", distance: "Rest day" },
      { type: "longruns", distance: "6-20 miles" },
    ];

    for (let week = 0; week < 16; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        const dateKey = this.getDateKey(currentDate);

        // Don't overwrite existing workouts
        if (!this.workouts[dateKey]) {
          const workout = { ...weekPattern[day] };

          // Adjust long run distance based on week
          if (workout.type === "longruns") {
            const longRunDistance = Math.min(8 + week, 20);
            workout.distance = `${longRunDistance} miles`;
          }

          this.workouts[dateKey] = workout;
        }
      }
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
