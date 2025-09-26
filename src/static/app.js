document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfoDiv = document.getElementById("user-info");

  // Helper: Show/hide user info and logout button
  function updateUserInfo(username) {
    if (username) {
      userInfoDiv.textContent = `Logged in as: ${username}`;
      userInfoDiv.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      loginForm.classList.add("hidden");
      registerForm.classList.add("hidden");
    } else {
      userInfoDiv.textContent = "";
      userInfoDiv.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      loginForm.classList.remove("hidden");
      registerForm.classList.remove("hidden");
    }
  }

  // Check current user
  async function fetchCurrentUser() {
    try {
      const res = await fetch("/me");
      if (res.ok) {
        const data = await res.json();
        updateUserInfo(data.username);
        return data.username;
      } else {
        updateUserInfo(null);
        return null;
      }
    } catch {
      updateUserInfo(null);
      return null;
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const username = await fetchCurrentUser();
    if (!username) {
      messageDiv.textContent = "Please log in to unregister.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle signup form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = await fetchCurrentUser();
    if (!username) {
      messageDiv.textContent = "Please log in to sign up.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle login form
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      const data = await res.json();
      if (res.ok) {
        messageDiv.textContent = data.message;
        messageDiv.className = "success";
        fetchCurrentUser();
      } else {
        messageDiv.textContent = data.detail || "Login failed";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Login error.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Handle register form
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      const data = await res.json();
      if (res.ok) {
        messageDiv.textContent = data.message;
        messageDiv.className = "success";
      } else {
        messageDiv.textContent = data.detail || "Registration failed";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Registration error.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/logout", { method: "POST" });
      if (res.ok) {
        messageDiv.textContent = "Logged out.";
        messageDiv.className = "success";
        updateUserInfo(null);
      } else {
        messageDiv.textContent = "Logout failed.";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch {
      messageDiv.textContent = "Logout error.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
  fetchCurrentUser();
});
