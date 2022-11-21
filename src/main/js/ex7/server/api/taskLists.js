const express = require('express');
const to = require('await-to-js').default;
const jwt = require('./utils/async-jsonwebtoken'); // More info at: https://github.com/auth0/node-jsonwebtoken ; https://jwt.io/#libraries
const axios = require('axios');
const { getBearerHeaders } = require('./utils/utils');

const TASKS_API_ENDPOINT = 'https://tasks.googleapis.com/tasks/v1'
const TASKS_LISTS_ENDPOINT = `${TASKS_API_ENDPOINT}/users/@me/lists`

module.exports = async function (database) {
	const tasksRouter = await require('./tasks')(database);
	const { jwtValidateMw, authorize } = await require('./middleware')(database);

	const router = express.Router();

	router.get('/', jwtValidateMw, async (req, res) => {
		const user = req.user;
		console.log("Received request for taskLists from user: ", user);

		const [tasksErr, taskListsResponse] = await to(
			axios.get(TASKS_LISTS_ENDPOINT, getBearerHeaders(user.access_token))
		);

		if (tasksErr)
			return res.status(500).send('Error fetching task lists');

		const taskLists = taskListsResponse.data.items.map(taskList => {
			return {
				id: taskList.id,
				title: taskList.title
			}
		});

		res.json(taskLists);
	});

	router.post('/', jwtValidateMw, async (req, res) => {
		console.log("Received request for tasks from user: ", req.user.email);
		const user = req.user;

		const { title } = req.body;

		if (!title)
			return res.status(400).json({ message: 'Bad request' });

		const [tasksListsErr, tasksListsResponse] = await to(axios.post(TASKS_LISTS_ENDPOINT, { title }, getBearerHeaders(user.access_token)));

		if (tasksListsErr)
			return res.status(500).send('Error creating task list');

		res.json({ message: "Task list created successfully" });
	});


	router.use("/:id/tasks", tasksRouter);

	return router;
};


