// Task Manager – talks directly to the Supabase REST API with fetch().

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descriptionInput = document.getElementById('task-description');
const submitButton = document.getElementById('task-submit');
const cancelButton = document.getElementById('task-cancel');
const formHeading = document.getElementById('form-heading');
const taskList = document.getElementById('task-list');
const statusMessage = document.getElementById('status-message');

let config = null;
let editingTask = null; // the task currently being edited, or null when adding

// ---------- Helpers ----------

function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

function apiUrl(query = '') {
  return `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${config.tableName}${query}`;
}

function headers(extra = {}) {
  const h = {
    apikey: config.supabasePublishableKey,
    'Content-Type': 'application/json',
    ...extra,
  };
  // Legacy "anon" keys are JWTs and also go in the Authorization header.
  // New sb_publishable_... keys only need the apikey header.
  if (config.supabasePublishableKey.startsWith('eyJ')) {
    h.Authorization = `Bearer ${config.supabasePublishableKey}`;
  }
  return h;
}

async function request(query, options = {}) {
  const response = await fetch(apiUrl(query), {
    ...options,
    headers: headers(options.headers),
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.message || body.error || detail;
    } catch (_) { /* response had no JSON body */ }
    throw new Error(`${response.status} ${detail}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ---------- REST API operations ----------

// GET /tasks?select=*
function getAllTasks() {
  return request('?select=*&order=id.asc');
}

// GET /tasks?id=eq.1&select=*
async function getTask(id) {
  const rows = await request(`?id=eq.${id}&select=*`);
  if (!rows || rows.length === 0) throw new Error(`Task ${id} not found`);
  return rows[0];
}

// POST /tasks
async function createTask(task) {
  const rows = await request('', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(task),
  });
  return rows[0];
}

// PUT /tasks?id=eq.1 – sends the complete record
async function saveTask(task) {
  const rows = await request(`?id=eq.${task.id}`, {
    method: 'PUT',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(task),
  });
  return rows[0];
}

// DELETE /tasks?id=eq.1
function deleteTask(id) {
  return request(`?id=eq.${id}`, { method: 'DELETE' });
}

// ---------- Rendering ----------

function renderTasks(tasks) {
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No tasks yet. Add one above.';
    taskList.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement('article');
    item.className = 'task-item' + (task.completed ? ' completed' : '');
    item.dataset.id = task.id;

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.description || '';

    const status = document.createElement('span');
    status.className = 'task-status';
    status.textContent = task.completed ? 'Completed' : 'Not completed';

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(
      makeButton('toggle-task', task.completed ? 'Mark incomplete' : 'Mark complete'),
      makeButton('edit-task', 'Edit'),
      makeButton('delete-task', 'Delete'),
    );

    item.append(title, description, status, actions);
    taskList.appendChild(item);
  }
}

function makeButton(className, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

async function loadTasks() {
  try {
    const tasks = await getAllTasks();
    renderTasks(tasks);
    return tasks;
  } catch (err) {
    showStatus(`Could not load tasks: ${err.message}`, 'error');
    return [];
  }
}

// ---------- Form (create + edit) ----------

function resetForm() {
  editingTask = null;
  form.reset();
  formHeading.textContent = 'Add a task';
  submitButton.textContent = 'Add task';
  cancelButton.hidden = true;
}

function startEditing(task) {
  editingTask = task;
  titleInput.value = task.title;
  descriptionInput.value = task.description || '';
  formHeading.textContent = `Edit task #${task.id}`;
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  titleInput.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!title) {
    showStatus('Title is required.', 'error');
    return;
  }

  submitButton.disabled = true;
  try {
    if (editingTask) {
      await saveTask({ ...editingTask, title, description });
      showStatus('Task updated.', 'success');
    } else {
      await createTask({ title, description, completed: false });
      showStatus('Task added.', 'success');
    }
    resetForm();
    await loadTasks();
  } catch (err) {
    showStatus(`Could not save task: ${err.message}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

cancelButton.addEventListener('click', () => {
  resetForm();
  showStatus('');
});

// ---------- Task buttons (event delegation) ----------

taskList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const item = button.closest('.task-item');
  const id = item.dataset.id;

  button.disabled = true;
  try {
    if (button.classList.contains('edit-task')) {
      startEditing(await getTask(id));
      showStatus(`Editing task #${id}.`);
    } else if (button.classList.contains('toggle-task')) {
      const task = await getTask(id);
      await saveTask({ ...task, completed: !task.completed });
      showStatus(task.completed ? 'Task marked incomplete.' : 'Task completed.', 'success');
      await loadTasks();
    } else if (button.classList.contains('delete-task')) {
      if (!confirm('Delete this task?')) return;
      await deleteTask(id);
      if (editingTask && String(editingTask.id) === id) resetForm();
      showStatus('Task deleted.', 'success');
      await loadTasks();
    }
  } catch (err) {
    showStatus(`Operation failed: ${err.message}`, 'error');
  } finally {
    button.disabled = false;
  }
});

// ---------- Start ----------

async function init() {
  try {
    const response = await fetch('config.json');
    if (!response.ok) throw new Error(`config.json returned ${response.status}`);
    config = await response.json();
  } catch (err) {
    showStatus(`Could not load configuration: ${err.message}`, 'error');
    return;
  }
  showStatus('Loading tasks…');
  const tasks = await loadTasks();
  if (statusMessage.className !== 'error') {
    showStatus(`Loaded ${tasks.length} task(s).`);
  }
}

init();
