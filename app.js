const STORAGE_KEY = "daymark-todos";

const state = {
  todos: loadTodos(),
  filter: "all"
};

const form = document.querySelector("#add-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const remainingCount = document.querySelector("#remaining-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const toast = document.querySelector("#toast");

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTodos) ? savedTodos : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function getVisibleTodos() {
  if (state.filter === "active") return state.todos.filter((todo) => !todo.completed);
  if (state.filter === "completed") return state.todos.filter((todo) => todo.completed);
  return state.todos;
}

function render() {
  const visibleTodos = getVisibleTodos();
  list.innerHTML = visibleTodos.map(createTodoMarkup).join("");
  list.hidden = visibleTodos.length === 0;
  emptyState.hidden = visibleTodos.length !== 0;

  if (state.todos.length === 0) {
    emptyTitle.textContent = "Nothing here yet";
    emptyCopy.textContent = "Add a task above to get started.";
  } else if (visibleTodos.length === 0) {
    emptyTitle.textContent = state.filter === "completed" ? "No completed tasks" : "All caught up";
    emptyCopy.textContent = state.filter === "completed" ? "Finished tasks will appear here." : "There is nothing left on your list.";
  }

  const activeCount = state.todos.filter((todo) => !todo.completed).length;
  document.querySelector('[data-count="all"]').textContent = state.todos.length;
  document.querySelector('[data-count="active"]').textContent = activeCount;
  document.querySelector('[data-count="completed"]').textContent = state.todos.length - activeCount;
  remainingCount.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
  clearCompletedButton.disabled = !state.todos.some((todo) => todo.completed);
}

function createTodoMarkup(todo) {
  const safeText = escapeHtml(todo.text);
  return `<li class="todo-item${todo.completed ? " is-complete" : ""}" data-id="${todo.id}">
    <button class="check-button" type="button" aria-label="${todo.completed ? "Mark incomplete" : "Mark complete"}" data-action="toggle">${todo.completed ? "✓" : ""}</button>
    <span class="todo-text">${safeText}</span>
    <button class="delete-button" type="button" aria-label="Delete ${safeText}" data-action="delete">×</button>
  </li>`;
}

function escapeHtml(text) {
  return text.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function addTodo(text) {
  state.todos.unshift({ id: crypto.randomUUID(), text, completed: false });
  saveTodos();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  addTodo(text);
  input.value = "";
  input.focus();
});

list.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const todoItem = actionButton.closest("[data-id]");
  const todo = state.todos.find((item) => item.id === todoItem.dataset.id);
  if (!todo) return;

  if (actionButton.dataset.action === "toggle") todo.completed = !todo.completed;
  if (actionButton.dataset.action === "delete") {
    state.todos = state.todos.filter((item) => item.id !== todo.id);
    showToast("Task removed");
  }
  saveTodos();
  render();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  state.todos = state.todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
  showToast("Completed tasks cleared");
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

render();
