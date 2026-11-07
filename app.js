"use strict";

const STORAGE_KEY = "daylight.tasks.v1";
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const addForm = document.querySelector("#add-form");
const taskInput = document.querySelector("#task-input");
const priorityInput = document.querySelector("#task-priority");
const clearCompletedButton = document.querySelector("#clear-completed");
const visibleCount = document.querySelector("#visible-count");
const progressPercent = document.querySelector("#progress-percent");
const progressFill = document.querySelector("#progress-fill");
const progressTrack = document.querySelector("#progress-track");
const progressMessage = document.querySelector("#progress-message");

let tasks = loadTasks();
let activeFilter = "all";

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(savedTasks)) return [];

    return savedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean" &&
        (task.priority === "high" || task.priority === "normal") &&
        typeof task.createdAt === "string"
    );
  } catch (error) {
    console.error("Could not load saved tasks.", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks to this browser.", error);
    progressMessage.textContent = "Your changes couldn't be saved in this browser.";
  }
}

function formatTaskDate(dateString) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getVisibleTasks() {
  if (activeFilter === "active") return tasks.filter((task) => !task.completed);
  if (activeFilter === "completed") return tasks.filter((task) => task.completed);
  if (activeFilter === "today") {
    const today = new Date().toDateString();
    return tasks.filter((task) => new Date(task.createdAt).toDateString() === today);
  }
  return tasks;
}

function makeTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-completed" : ""}`;
  item.dataset.taskId = task.id;

  const toggle = document.createElement("button");
  toggle.className = "task-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", task.completed ? "Mark task as in progress" : "Mark task as completed");
  toggle.setAttribute("aria-pressed", String(task.completed));
  toggle.textContent = task.completed ? "✓" : "";

  const copy = document.createElement("div");
  copy.className = "task-copy";

  const name = document.createElement("div");
  name.className = "task-name";
  name.textContent = task.text;
  copy.append(name);

  const meta = document.createElement("div");
  meta.className = "task-meta";
  const date = document.createElement("time");
  date.className = "task-date";
  date.dateTime = task.createdAt;
  date.textContent = formatTaskDate(task.createdAt);
  meta.append(date);

  if (task.priority === "high") {
    const badge = document.createElement("span");
    badge.className = "priority-badge";
    badge.textContent = "IMPORTANT";
    meta.append(badge);
  }

  copy.append(meta);

  const remove = document.createElement("button");
  remove.className = "task-delete";
  remove.type = "button";
  remove.setAttribute("aria-label", `Delete task: ${task.text}`);
  remove.textContent = "×";

  item.append(toggle, copy, remove);
  return item;
}

function render() {
  const visibleTasks = getVisibleTasks();
  const completedTasks = tasks.filter((task) => task.completed).length;
  const percent = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  taskList.replaceChildren(...visibleTasks.map(makeTaskElement));
  emptyState.classList.toggle("is-visible", visibleTasks.length === 0);
  visibleCount.textContent = String(visibleTasks.length);
  progressPercent.textContent = String(percent);
  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute("aria-valuenow", String(percent));
  progressMessage.textContent =
    tasks.length === 0
      ? "Every small step counts."
      : completedTasks === tasks.length
        ? "Look at you go. Everything is done!"
        : `${completedTasks} of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} complete.`;

  document.querySelector("#all-count").textContent = String(tasks.length);
  document.querySelector("#today-count").textContent = String(
    tasks.filter((task) => new Date(task.createdAt).toDateString() === new Date().toDateString()).length
  );
  document.querySelector("#completed-count").textContent = String(completedTasks);
  clearCompletedButton.hidden = completedTasks === 0;
}

function setFilter(filter) {
  activeFilter = filter;

  document.querySelectorAll(".filter-chip").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });

  const headings = {
    all: "Your tasks",
    today: "Today's tasks",
    active: "In progress",
    completed: "Completed tasks",
  };
  document.querySelector("#tasks-heading").textContent = headings[filter] || "Your tasks";
  render();
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
    priority: priorityInput.value,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  taskInput.value = "";
  priorityInput.value = "normal";
  setFilter("all");
  taskInput.focus();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const item = button?.closest(".task-item");
  if (!button || !item) return;

  const task = tasks.find((candidate) => candidate.id === item.dataset.taskId);
  if (!task) return;

  if (button.classList.contains("task-toggle")) {
    task.completed = !task.completed;
  } else if (button.classList.contains("task-delete")) {
    tasks = tasks.filter((candidate) => candidate.id !== task.id);
  } else {
    return;
  }

  saveTasks();
  render();
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
}).format(new Date());

render();
