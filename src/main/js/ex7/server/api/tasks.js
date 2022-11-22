const express = require('express');
const to = require('await-to-js').default;
const axios = require('axios');
const {authHeaders} = require('./utils/utils');

const TASKS_API_ENDPOINT = 'https://tasks.googleapis.com/tasks/v1';

module.exports = async function (database) {
    const {jwtValidateMw, authorize} = await require('./utils/middleware.js')(database);
    const router = express.Router({mergeParams: true});

    router.get('/', jwtValidateMw, authorize('tasks', 'read'), listTasks);
    router.post('/', jwtValidateMw, authorize("tasks", "write"), insertTask);

    /**
     * Fetchs the tasks for a specific task list from the API.
     *
     * @param {e.Request} req the request
     * @param {e.Response} res the response
     */
    async function listTasks(req, res) {
        const user = req.user;
        const {id: taskListId} = req.params;
        console.log("Received request for tasks of ", taskListId, " from user: ", req.user.email);

        if (!taskListId)
            return res.status(400).json({message: 'Bad request'});

        const [tasksErr, tasksResponse] = await to(
            axios.get(`${TASKS_API_ENDPOINT}/lists/${taskListId}/tasks`, authHeaders(user.access_token))
        );

        if (tasksErr)
            return res.status(500).send("Error fetching tasks");

        const tasks = tasksResponse.data.items.map(task => {
            return {
                id: task.id,
                title: task.title,
                notes: task.notes,
                completed: task.status === 'completed',
                due: task.due
            };
        });

        res.json(tasks);
    }

    /**
     * Inserts a new task in a specific task list.
     *
     * @param {e.Request} req the request
     * @param {e.Response} res the response
     */
    async function insertTask(req, res) {
        const user = req.user;
        const {id: taskListId} = req.params;
        const {title, notes, due} = req.body;

        console.log("Received request for tasks of ", taskListId, " from user: ", req.user.email);
        if (!taskListId)
            return res.status(400).json({message: 'Bad request'});

        const [tasksErr, tasksResponse] = await to(
            axios.post(`${TASKS_API_ENDPOINT}/lists/${taskListId}/tasks`, {
                title,
                notes,
                due
            }, authHeaders(user.access_token))
        );

        if (tasksErr)
            return res.status(500).send("Error creating task");

        const task = tasksResponse.data;

        res.status(201).json({
            id: task.id,
            title: task.title,
            notes: task.notes,
            completed: task.status === 'completed',
            due: task.due
        });
    }

    return router;
}
