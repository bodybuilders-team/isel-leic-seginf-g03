const express = require('express');
const to = require('await-to-js').default;
const axios = require('axios');
const {authHeaders} = require('./utils/utils');

const TASKS_API_ENDPOINT = 'https://tasks.googleapis.com/tasks/v1';
const TASKS_LISTS_ENDPOINT = `${TASKS_API_ENDPOINT}/users/@me/lists`;

module.exports = async function (database) {
    const tasksRouter = await require('./tasks')(database);
    const {jwtValidateMw, authorize} = await require('./utils/middleware.js')(database);

    const router = express.Router();

    router.get('/', jwtValidateMw, authorize("tasks", "read"), getTaskList);
    router.post('/', jwtValidateMw, authorize("tasks", "write"), createTaskList);
    router.use("/:id/tasks", tasksRouter);

    /**
     * Fetchs the tasks lists from the API.
     *
     * @param {e.Request} req the request
     * @param {e.Response} res the response
     *
     * @returns {Promise<*>} promise of the tasks lists
     */
    async function getTaskList(req, res) {
        const user = req.user;
        console.log("Received request for taskLists from user: ", user);

        const [tasksErr, taskListsResponse] = await to(
            axios.get(TASKS_LISTS_ENDPOINT, authHeaders(user.access_token))
        );

        if (tasksErr)
            return res.status(500).send('Error fetching task lists');

        const taskLists = taskListsResponse.data.items.map(taskList => {
            return {
                id: taskList.id,
                title: taskList.title
            };
        });

        res.json(taskLists);
    }

    /**
     * Creates a new task list.
     *
     * @param {e.Request} req the request
     * @param {e.Response} res the response
     *
     * @returns {Promise<*>} promise of the task list
     */
    async function createTaskList(req, res) {
        console.log("Received request for taskLists from user: ", req.user.email);
        const user = req.user;
        const {title} = req.body;

        if (!title)
            return res.status(400).json({message: 'Bad request'});

        const [tasksListsErr, _] = await to(
            axios.post(TASKS_LISTS_ENDPOINT, {title}, authHeaders(user.access_token))
        );

        if (tasksListsErr)
            return res.status(500).send('Error creating task list');

        res.json({message: "Task list created successfully"});
    }


    return router;
};
