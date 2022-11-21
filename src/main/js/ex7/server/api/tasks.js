const express = require('express');
const to = require('await-to-js').default;
const jwt = require('./utils/async-jsonwebtoken'); // More info at: https://github.com/auth0/node-jsonwebtoken ; https://jwt.io/#libraries
const axios = require('axios');
const { getBearerHeaders } = require('./utils/utils');

const TASKS_API_ENDPOINT = 'https://tasks.googleapis.com/tasks/v1'

module.exports = async function (database) {
	const { jwtValidateMw, authorize } = await require('./middleware')(database);
	const router = express.Router({ mergeParams: true });

	router.get('/', jwtValidateMw, authorize('tasks', 'read'), async (req, res) => {
		const user = req.user;
		const { id: taskListId } = req.params;
		console.log("Received request for tasks of ", taskListId, " from user: ", req.user.email);
	
		if (!taskListId)
			return res.status(400).json({ message: 'Bad request' });

		const [tasksErr, tasksResponse] = await to(
			axios.get(`${TASKS_API_ENDPOINT}/lists/${taskListId}/tasks`, getBearerHeaders(user.access_token)));

		if (tasksErr)
			return res.status(500).send("Error fetching tasks");

		const tasks = tasksResponse.data.items.map(task => {
			return {
				id: task.id,
				title: task.title,
				notes: task.notes,
				completed: task.status === 'completed',
				due: task.due
			}
		});

		res.json(tasks);
	});

	router.post('/', jwtValidateMw, async (req, res) => {
		const user = req.user;
		const { id: taskListId } = req.params;
		const { title, notes, due } = req.body;

		console.log("Received request for tasks of ", taskListId, " from user: ", req.user.email);
		if (!taskListId)
			return res.status(400).json({ message: 'Bad request' });

		const [tasksErr, tasksResponse] = await to(
			axios.post(`${TASKS_API_ENDPOINT}/lists/${taskListId}/tasks`, {
				title,
				notes,
				due
			}, getBearerHeaders(user.access_token)));

		if (tasksErr)
			return res.status(500).send("Error creating task");

		const task = tasksResponse.data;

		res.json({
			id: task.id,
			title: task.title,
			notes: task.notes,
			completed: task.status === 'completed',
			due: task.due
		});
	});

	return router
}