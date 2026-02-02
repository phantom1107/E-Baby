(function () {
  // Enhanced Threaded Chat Client with Dragging, Window Controls, and Themes
  function getMeta(name) {
    const m = document.querySelector('meta[name="' + name + '"]');
    return m ? m.getAttribute("content") : "";
  }

  const CURRENT_USER = getMeta("user-email") || "";
  const CURRENT_ROLE = getMeta("user-role") || "";
  const IS_ADMIN = CURRENT_ROLE === "Admin";

  // Theme options: 'default', 'dark', 'ocean', 'forest', 'sunset'
  const THEMES = ["default", "dark", "ocean", "forest", "sunset"];
  let currentThemeIndex = 0;
  let viewMode = "chats"; // 'chats' or 'appeals' (for admin only)

  const openBtn = document.getElementById("openChatBtn");
  const closeBtn = document.getElementById("chatCloseBtn");
  const minimizeBtn = document.getElementById("chatMinimizeBtn");
  const maximizeBtn = document.getElementById("chatMaximizeBtn");
  const themeToggleBtn = document.getElementById("chatThemeToggle");
  const chatPanel = document.getElementById("chatPanel");
  const chatHeader = document.getElementById("chatHeader");
  const threadsListEl = document.getElementById("threadsList");
  const chatWithEl = document.getElementById("chatWith");
  const messagesEl = document.getElementById("chatMessages");
  const inputEl = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");

  let selectedThread = null;
  // Make selectedThread globally accessible
  window.selectedThread = selectedThread;
  let pollHandle = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let originalSize = { width: 900, height: 600 };
  let isMaximized = false;

  // Initialize theme from localStorage
  function initTheme() {
    const savedTheme = localStorage.getItem("chatTheme") || "default";
    const themeIdx = THEMES.indexOf(savedTheme);
    currentThemeIndex = themeIdx >= 0 ? themeIdx : 0;
    applyTheme();
  }

  function applyTheme() {
    const theme = THEMES[currentThemeIndex];
    if (theme === "default") {
      document.body.removeAttribute("data-chat-theme");
    } else {
      document.body.setAttribute("data-chat-theme", theme);
    }
    localStorage.setItem("chatTheme", theme);
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    applyTheme();
  }

  // Toggle between chats and appeals view (admin only)
  function toggleViewMode() {
    if (!IS_ADMIN) return;
    viewMode = viewMode === "chats" ? "appeals" : "chats";

    // Update header title
    const headerTitle = document.querySelector(".chat-panel-title");
    if (headerTitle) {
      headerTitle.textContent =
        viewMode === "appeals" ? "Appeals & Bans" : "Message Center";
    }

    // Add/update toggle button state
    let modeToggle = document.getElementById("viewModeToggle");
    if (!modeToggle) {
      modeToggle = document.createElement("button");
      modeToggle.id = "viewModeToggle";
      modeToggle.className = "chat-mode-toggle";
      modeToggle.title = "Toggle view mode";
      const controls = document.querySelector(".chat-window-controls");
      controls.insertBefore(modeToggle, controls.firstChild);
    }
    modeToggle.innerHTML =
      viewMode === "appeals"
        ? '<i class="fas fa-exclamation-triangle"></i>'
        : '<i class="fas fa-comments"></i>';

    // Reload threads
    selectedThread = null;
    loadThreads();
  }

  // Dragging functionality
  function startDrag(e) {
    if (isMaximized || chatPanel.classList.contains("minimized")) return;
    isDragging = true;
    dragOffset.x = e.clientX - chatPanel.offsetLeft;
    dragOffset.y = e.clientY - chatPanel.offsetTop;
    chatPanel.style.cursor = "grabbing";
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;
    chatPanel.style.right = "auto";
    chatPanel.style.left = e.clientX - dragOffset.x + "px";
    chatPanel.style.top = e.clientY - dragOffset.y + "px";
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    chatPanel.style.cursor = "move";
  }

  function toggleMinimize() {
    chatPanel.classList.toggle("minimized");
  }

  function toggleMaximize() {
    isMaximized = !isMaximized;
    chatPanel.classList.toggle("fullscreen");
    if (isMaximized) {
      maximizeBtn.querySelector("i").className = "fas fa-compress";
    } else {
      maximizeBtn.querySelector("i").className = "fas fa-expand";
    }
  }

  function showPanel() {
    if (!chatPanel) return;
    console.log(
      "Opening chat panel. CURRENT_USER:",
      CURRENT_USER,
      "CURRENT_ROLE:",
      CURRENT_ROLE,
      "IS_ADMIN:",
      IS_ADMIN
    );
    chatPanel.classList.remove("hidden");
    chatPanel.style.display = "flex";
    chatPanel.setAttribute("aria-hidden", "false");
    loadThreads();
  }

  // Make showPanel globally available
  window.showChatPanel = showPanel;

  function hidePanel() {
    if (!chatPanel) return;
    chatPanel.classList.add("hidden");
    chatPanel.style.display = "none";
    chatPanel.setAttribute("aria-hidden", "true");
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = null;
  }

  async function loadThreads() {
    try {
      console.log("===== loadThreads() START =====");
      console.log("CURRENT_USER:", CURRENT_USER);
      console.log("CURRENT_ROLE:", CURRENT_ROLE);
      console.log("IS_ADMIN:", IS_ADMIN);
      console.log("viewMode:", viewMode);

      // Use database-backed endpoints for chat persistence
      const endpoint =
        IS_ADMIN && viewMode === "appeals"
          ? "/chat/appeals"
          : "/chat/db/threads";
      console.log("Using endpoint:", endpoint);

      const res = await fetch(endpoint);
      console.log("Fetch response status:", res.status);

      if (!res.ok) {
        console.error("Failed to fetch threads:", res.status);
        if (messagesEl)
          messagesEl.innerHTML =
            '<div class="no-chat">Error loading threads (Status: ' +
            res.status +
            ")</div>";
        return;
      }

      const data = await res.json();
      console.log("Raw threads from backend:", data);
      console.log("Number of threads received:", data.length);

      // Store threads data for filtering
      window.currentThreadsData = data;

      // No need to filter on client side - server handles it
      let threadsToShow = data;

      console.log("Threads to display:", threadsToShow);
      renderThreads(threadsToShow);

      // auto-select first thread for users or admin (only if no filter is active)
      // If filter is active, let the filter function handle selection
      if (!window.chatUserTypeFilter) {
        if (!selectedThread && threadsToShow && threadsToShow.length) {
          console.log(
            "Auto-selecting first thread:",
            threadsToShow[0].thread_id
          );
          selectThread(threadsToShow[0].thread_id);
        } else if (
          !selectedThread &&
          (!threadsToShow || threadsToShow.length === 0)
        ) {
          console.warn("No threads available to display");
          if (messagesEl)
            messagesEl.innerHTML =
              '<div class="no-chat">No conversations available</div>';
        }
      } else {
        // Filter is active - don't auto-select, let filter function handle it
        console.log("Filter active, skipping auto-select");
        if (messagesEl && (!threadsToShow || threadsToShow.length === 0)) {
          messagesEl.innerHTML =
            '<div class="no-chat">No conversations available</div>';
        }
      }
      console.log("===== loadThreads() END =====");
    } catch (e) {
      console.error("loadThreads ERROR:", e);
      if (messagesEl)
        messagesEl.innerHTML =
          '<div class="no-chat">Error: ' + e.message + "</div>";
    }
  }

  function renderThreads(list) {
    if (!threadsListEl) return;
    if (!list || list.length === 0) {
      threadsListEl.innerHTML = '<div class="no-threads">No threads</div>';
      return;
    }

    // Group threads by other_user_email to show unique conversations
    // If multiple threads exist with the same other_user_email, use the most recent one
    const threadsByEmail = new Map();
    list.forEach((t) => {
      const otherEmail = t.other_user_email || t.thread_id;
      if (!threadsByEmail.has(otherEmail)) {
        threadsByEmail.set(otherEmail, t);
      } else {
        // If thread already exists, keep the one with the most recent message
        const existing = threadsByEmail.get(otherEmail);
        const existingTime = existing.last?.timestamp || "";
        const currentTime = t.last?.timestamp || "";
        if (currentTime > existingTime) {
          threadsByEmail.set(otherEmail, t);
        }
      }
    });

    // Convert map back to array and sort by last message timestamp
    const uniqueThreads = Array.from(threadsByEmail.values()).sort((a, b) => {
      const timeA = a.last?.timestamp || "";
      const timeB = b.last?.timestamp || "";
      return timeB.localeCompare(timeA); // Most recent first
    });

    threadsListEl.innerHTML = uniqueThreads
      .map((t) => {
        const preview = t.last ? t.last.message || "" : "";
        // Display other_user_email if available, otherwise fall back to thread_id
        // Check if we should show name instead of email
        let who = t.other_user_email || t.thread_id;
        if (
          window.showThreadNames &&
          window.availableUsers &&
          t.other_user_email
        ) {
          // Try to find name from available users
          for (const userType in window.availableUsers) {
            const user = window.availableUsers[userType].find(
              (u) => u.email === t.other_user_email
            );
            if (user && user.name) {
              who = user.name;
              break;
            }
          }
        }
        const isActive = selectedThread === t.thread_id ? "active" : "";
        return `<div class="thread-item ${isActive}" data-id="${encodeURIComponent(
          t.thread_id
        )}" data-other-email="${t.other_user_email || ""}" data-other-type="${
          t.other_user_type || ""
        }"><div class="thread-name">${escapeHtml(
          who
        )}</div><div class="thread-preview">${escapeHtml(preview)}</div></div>`;
      })
      .join("");

    // Use event delegation for better reliability
    // Remove old listener if exists
    if (threadsListEl._clickHandler) {
      threadsListEl.removeEventListener("click", threadsListEl._clickHandler);
    }

    // Add new event listener using delegation
    threadsListEl._clickHandler = (e) => {
      // Find the closest thread-item
      const threadItem = e.target.closest(".thread-item");
      if (!threadItem) return;

      e.preventDefault();
      e.stopPropagation();

      const id = decodeURIComponent(threadItem.getAttribute("data-id"));
      const otherEmail = threadItem.getAttribute("data-other-email");
      console.log("Thread item clicked:", { id, otherEmail });

      if (typeof selectThread === "function") {
        selectThread(id);
      } else if (typeof window.selectThread === "function") {
        window.selectThread(id);
      }
    };

    threadsListEl.addEventListener("click", threadsListEl._clickHandler);

    // Apply filter if set - wait a bit to ensure filter function is available
    if (window.chatUserTypeFilter) {
      setTimeout(() => {
        if (typeof window.filterThreadsByUserType === "function") {
          window.filterThreadsByUserType(window.chatUserTypeFilter);
        } else if (typeof filterThreadsByUserType === "function") {
          filterThreadsByUserType(window.chatUserTypeFilter);
        }
      }, 100);
    }
  }

  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>\"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Format timestamp to GMT+8 (Philippine Time)
  function formatToGMT8(ts) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      // Normalize to UTC milliseconds then add 8 hours
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const gmt8 = new Date(utc + 8 * 60 * 60 * 1000);
      return gmt8.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return ts || "";
    }
  }

  async function selectThread(threadId) {
    console.log("selectThread() called with:", threadId);
    selectedThread = threadId;
    window.selectedThread = threadId;

    // Update active state in thread list
    let selectedEmail = null;
    let selectedName = null;
    if (threadsListEl) {
      Array.from(threadsListEl.querySelectorAll(".thread-item")).forEach(
        (el) => {
          el.classList.remove("active");
          const elThreadId = decodeURIComponent(el.getAttribute("data-id"));
          const elOtherEmail = el.getAttribute("data-other-email");
          const elUserName = el.getAttribute("data-user-name");

          // Match by exact thread_id
          if (elThreadId === threadId) {
            el.classList.add("active");
            selectedEmail = elOtherEmail;
            selectedName = elUserName;

            // Update chat header - show name if available and toggle is on, otherwise email
            if (chatWithEl) {
              if (window.showThreadNames && selectedName) {
                chatWithEl.textContent = selectedName;
              } else if (selectedEmail) {
                chatWithEl.textContent = selectedEmail;
              } else {
                chatWithEl.textContent = threadId;
              }
            }
          }
        }
      );
    } else {
      // Fallback: if threadsListEl not available, try to get from window.currentThreadsData
      if (chatWithEl && window.currentThreadsData) {
        // Try to find thread by thread_id first
        let thread = window.currentThreadsData.find(
          (t) => t.thread_id === threadId
        );

        // If not found and threadId looks like an email, try to find by other_user_email
        if (!thread && threadId.indexOf("_") === -1) {
          thread = window.currentThreadsData.find(
            (t) => t.other_user_email === threadId
          );
          if (thread) {
            // Use the found thread's thread_id
            selectedThread = thread.thread_id;
            window.selectedThread = thread.thread_id;
          }
        }

        if (thread && thread.other_user_email) {
          selectedEmail = thread.other_user_email;
          chatWithEl.textContent = thread.other_user_email;
        } else {
          chatWithEl.textContent = threadId;
        }
      } else if (chatWithEl) {
        chatWithEl.textContent = threadId;
      }
    }

    // If we have an email but no thread found, try to extract email from threadId
    if (!selectedEmail && threadId.includes("_")) {
      const emails = threadId.split("_");
      const currentUser = CURRENT_USER;
      selectedEmail =
        emails.find((email) => email !== currentUser) || emails[0];

      // Try to get name from available users
      if (window.showThreadNames && window.availableUsers && selectedEmail) {
        for (const userType in window.availableUsers) {
          const user = window.availableUsers[userType].find(
            (u) => u.email === selectedEmail
          );
          if (user && user.name) {
            selectedName = user.name;
            break;
          }
        }
      }

      if (chatWithEl) {
        if (window.showThreadNames && selectedName) {
          chatWithEl.textContent = selectedName;
        } else if (selectedEmail) {
          chatWithEl.textContent = selectedEmail;
        } else {
          chatWithEl.textContent = threadId;
        }
      }
    }

    // Load messages for the selected thread
    await loadMessages();
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(loadMessages, 3000);
  }

  // Make selectThread globally available for external use
  window.selectThread = selectThread;

  async function loadMessages() {
    if (!selectedThread) {
      console.log("loadMessages: No thread selected");
      if (messagesEl) {
        messagesEl.innerHTML =
          '<div class="no-chat">Select a conversation to start chatting</div>';
      }
      return;
    }
    try {
      console.log(
        "loadMessages() fetching from /chat/db/threads/" +
          encodeURIComponent(selectedThread) +
          "/messages"
      );
      const res = await fetch(
        "/chat/db/threads/" + encodeURIComponent(selectedThread) + "/messages"
      );
      console.log("loadMessages() response status:", res.status);

      if (!res.ok) {
        console.error("Failed to fetch messages:", res.status);
        // If it's a new thread with no messages yet (404 or empty response), show empty state
        if (res.status === 404 || res.status === 200) {
          renderMessages([]);
        } else {
          renderMessages([]);
        }
        return;
      }

      const data = await res.json();
      console.log("Messages loaded for thread " + selectedThread + ":", data);
      renderMessages(data || []);
    } catch (e) {
      console.error("loadMessages ERROR:", e);
      // Show empty state for new threads or errors
      renderMessages([]);
    }
  }

  function renderMessages(list) {
    if (!messagesEl) return;
    if (!list || !list.length) {
      messagesEl.innerHTML =
        '<div class="no-chat">No messages yet. Start the conversation!</div>';
      return;
    }
    messagesEl.innerHTML = list
      .map((m) => {
        // Handle both message formats:
        // Format 1: {sender, role, message, timestamp}
        // Format 2: {sender, sender_email, text, timestamp} (from banned chat)
        const sender = m.sender || m.sender_email || "User";
        const messageText = m.message || m.text || "";
        const who = sender || "User";
        const time = formatToGMT8(m.timestamp);
        const mine =
          m.sender === CURRENT_USER ||
          m.sender_email === CURRENT_USER ||
          (m.role === CURRENT_ROLE && !CURRENT_USER);
        return `<div class="msg ${
          mine ? "mine" : ""
        }"><div class="meta"><strong>${escapeHtml(
          who
        )}</strong><span class="ts">${time}</span></div><div class="body">${escapeHtml(
          messageText
        )}</div></div>`;
      })
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    if (!selectedThread) return alert("Select a conversation first");
    const text = inputEl.value.trim();
    if (!text) return;
    const payload = {
      sender: CURRENT_USER || selectedThread,
      role: CURRENT_ROLE || "User",
      message: text,
    };
    try {
      const res = await fetch(
        "/chat/db/threads/" + encodeURIComponent(selectedThread) + "/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        inputEl.value = "";
        loadMessages();
      }
    } catch (e) {
      console.error("sendMessage", e);
    }
  }

  // Initialize all on DOM ready
  function initializeChat() {
    // Event Listeners
    // Only add click listener if button doesn't have onclick handler (for dropdown)
    if (openBtn && !openBtn.hasAttribute("onclick")) {
      openBtn.addEventListener("click", showPanel);
    }
    if (closeBtn) closeBtn.addEventListener("click", hidePanel);
    if (minimizeBtn) minimizeBtn.addEventListener("click", toggleMinimize);
    if (maximizeBtn) maximizeBtn.addEventListener("click", toggleMaximize);
    if (themeToggleBtn) themeToggleBtn.addEventListener("click", cycleTheme);
    if (chatHeader) chatHeader.addEventListener("mousedown", startDrag);
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (inputEl)
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

    // Add toggle view mode button listener for admin
    if (IS_ADMIN) {
      // Create and add the toggle button
      const controls = document.querySelector(".chat-window-controls");
      if (controls) {
        const modeToggle = document.createElement("button");
        modeToggle.id = "viewModeToggle";
        modeToggle.className = "chat-mode-toggle";
        modeToggle.title = "Toggle between chats and appeals";
        modeToggle.innerHTML = '<i class="fas fa-comments"></i>';
        modeToggle.addEventListener("click", toggleViewMode);
        controls.insertBefore(modeToggle, controls.firstChild);
      }
    }

    // Initialize theme
    initTheme();
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChat);
  } else {
    initializeChat();
  }
})();
