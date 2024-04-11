const axios = require('axios');
const { time } = require('console');
const fs = require('fs');
const { start } = require('repl');
const mongoose = require('mongoose');

const observationTime = 3 * 365 * 24 * 60 * 60;
const observationWindow = 6 * 31 * 24 * 60 * 60;
const improvementThreshold = 150;

const contestThreshold = 20;
const problemThreshold = 150;

const getEpochSecond = () => {
	return Math.floor(new Date().getTime() / 1000);
}

const getRating = async (handle) => {
	const response = await axios({
		method: 'get',
		url: `https://codeforces.com/api/user.rating?handle=${handle}`,
	});
	return response.data.result;
};

const getSubmissions = async (handle) => {
	const response = await axios({
		method: 'get',
		url: `https://codeforces.com/api/user.status?handle=${handle}`,
	});
	return response.data.result;
}

// returns a list of all the problems a user has solved that led to their rating increase
const getEligibleUser = async (user) => {
	const { handle } = user;
	const now = getEpochSecond();
	const thresholdTime = now - observationTime;
	const cutoffTime = 147 * 24 * 60 * 60;
	const problemsLower = 26;
	const problemsUpper = 92;

	// filters ratingChange (contests) of the past 3 years
	let ratings = await getRating(handle);
	ratings = ratings.filter(r => r.ratingUpdateTimeSeconds >= thresholdTime);

	let startRating = ratings[0].newRating;
	let startTime = 0;
	let endTime = 0;
	if (startRating >= 2000){
		return false;
	}
	for (const rating of ratings){
		if (rating.newRating >= 1900 && startTime === 0){
			startTime = rating.ratingUpdateTimeSeconds;
		}
		if (rating.newRating >= 2100 && endTime === 0 && startTime != 0){
			endTime = rating.ratingUpdateTimeSeconds;
			break;  
		}
	}

	if (startTime === 0 || endTime === 0){
		return false;
	}

	let allSubmissions = await getSubmissions(handle);
	allSubmissions = allSubmissions.filter(s => s.creationTimeSeconds >= startTime && s.creationTimeSeconds <= endTime && s.verdict === 'OK' && s.author.participantType === 'PRACTICE');
	
	// gets the unique problems solved and submissions
	const problemIds = new Set();
	let submissions = [];
	for (const submission of allSubmissions) {
		const key = getProblemKey(submission.problem);
		if (problemIds.has(key)) {
			continue;
		}
		problemIds.add(key);
		submissions.push(submission);
	}

	if (endTime - startTime <= cutoffTime && submissions.length >= problemsLower && submissions.length <= problemsUpper){
		return true;
	}
	else {
		return false;
	}
}

const getProblemKey = (problem) => {
	return `${problem.contestId}:${problem.index}`;
}

const getEligibleUsersInBatch = async (users, eligibleUsers, errCount, start, end, skippedUsers) => {
	console.log(`Processing batch ${start} to ${end}`);
	const last = Math.min(end, users.length);
	for (let i = start; i < last; i++) {
		const user = users[i];
		try {
			const isSuper = await getEligibleUser(user);
			if (isSuper){
				eligibleUsers.push(user);
			}
			// for (const problem of problems) {
			// 	const problemKey = getProblemKey(problem);
			// 	if (!problemMap[problemKey]) {
			// 		problemMap[problemKey] = problem;
			// 		problemFreq[problemKey] = 0;
			// 	}
			// 	problemFreq[problemKey]++;
			// }
		} catch (err) {
			// console.log(`Error for ${user.handle}: ${err}`);
			if (!errCount[i]) errCount[i] = 0;
			errCount[i]++;
			if (errCount[i] <= 6) {
				await new Promise(resolve => setTimeout(resolve, 3000));
				i--;
			} else {
				skippedUsers.push(user);
			}
		}
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	console.log(`Processed batch ${start} to ${end}`);
}

const getAllEligibleUsers= async (startFrom, doSkipped = false) => {
	const userFile = JSON.parse(fs.readFileSync('./cfusers.json'));
	let users = [...userFile.result];
	
	const errCount = {};
	// let problemMap = {};
	// let problemFreq = {};
	let eligibleUsers = [];
	let skippedUsers = [];
	if (startFrom) {
		const checkpoint = JSON.parse(fs.readFileSync(`./checkpoints/checkpoint_${startFrom}.json`));
		// problemMap = checkpoint.problemMap;
		// problemFreq = checkpoint.problemFreq;
		eligibleUsers = checkpoint.eligibleUsers;
		skippedUsers = checkpoint.skippedUsers;
		if (doSkipped) {
			users = [...skippedUsers];
			skippedUsers = [];
		}
	} else {
		startFrom = 0;
	}

	console.log('Processing users:' + users.length);
	const checkPointSize = 100;
	const batchSize = 20;
	let start = startFrom;
	if (doSkipped) {
		start = 0;
	}
	for (let i = start; i < users.length; i += checkPointSize) {
		const toWrite = {
			// problemMap: problemMap,
			// problemFreq: problemFreq,
			eligibleUsers: eligibleUsers,
			skippedUsers: skippedUsers,
		};
		let checkpoint = startFrom + i;
		fs.writeFileSync(`./checkpoints/checkpoint_${checkpoint}.json`, JSON.stringify(toWrite));
		// console.log(`Checkpoint upto ${checkpoint} written, skipped users: ${skippedUsers.length}, problems: ${Object.keys(problemMap).length}`);
		console.log(`Checkpoint upto ${checkpoint} written, skipped users: ${skippedUsers.length}, super users: ${eligibleUsers.length}`);

		let tasks = [];
		for (let j = 0; j < checkPointSize; j += batchSize) {
			// tasks.push(getEligibleProblemsInBatch(users, problemMap, problemFreq, errCount, i + j, i + j + batchSize, skippedUsers));
			tasks.push(getEligibleUsersInBatch(users, eligibleUsers, errCount, i + j, i + j + batchSize, skippedUsers));
		}
		await Promise.allSettled(tasks);
	}
	const toWrite = {
		// problemMap: problemMap,
		// problemFreq: problemFreq,
		eligibleUsers: eligibleUsers,
		skippedUsers: skippedUsers,
	};
	fs.writeFileSync(`./checkpoints/checkpoint_${users.length}.json`, JSON.stringify(toWrite));
	console.log('Done');
}

getAllEligibleUsers();