/**
 * Fetchs the tasks lists from the API.
 *
 * @returns {Promise<*>} promise of the tasks lists
 */
async function getTaskLists() {
    return await (await fetch(`/api/taskLists`)).json();
}

/**
 * Fetchs the tasks from the API.
 *
 * @param taskListId the task list id
 * @returns {Promise<*>} promise of the tasks
 */
async function getTasks(taskListId) {
    return await (await fetch(`/api/taskLists/${taskListId}/tasks`)).json();
}

/**
 * Adds a task to the API.
 *
 * @param taskListId the task list id
 * @param task the task to add
 *
 * @returns {Promise<*>} promise of the task
 */
async function insertTask(taskListId, task) {
    const res = await fetch(`/api/taskLists/${taskListId}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: task,
        })
    });

    if (res.status === 201)
        return await res.json();
    else
        return null;
}

export default {
    getTaskLists,
    getTasks,
    insertTask
}