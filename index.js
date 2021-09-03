const execa = require('execa')
const stripAnsi = require('strip-ansi')
const defaultShell = require('default-shell')

const args = [
	'-ilc',
	'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit',
];

const env = {
	// Disables Oh My Zsh auto-update thing that can block the process.
	DISABLE_AUTO_UPDATE: 'true',
};

const parseEnv = env => {
	env = env.split('_SHELL_ENV_DELIMITER_')[1];
	const returnValue = {};

	for (const line of stripAnsi(env).split('\n').filter(line => Boolean(line))) {
		const [key, ...values] = line.split('=');
		returnValue[key] = values.join('=');
	}

	return returnValue;
};

export async function shellEnv(shell) {
	if (process.platform === 'win32') {
		return process.env;
	}

	try {
		const {stdout} = await execa(shell || defaultShell, args, {env});
		return parseEnv(stdout);
	} catch (error) {
		if (shell) {
			throw error;
		} else {
			return process.env;
		}
	}
}

export function shellEnvSync(shell) {
	if (process.platform === 'win32') {
		return process.env;
	}

	try {
		const {stdout} = execa.sync(shell || defaultShell, args, {env});
		return parseEnv(stdout);
	} catch (error) {
		if (shell) {
			throw error;
		} else {
			return process.env;
		}
	}
}

async function shellPath() {
	const {PATH} = await shellEnv();
	return PATH;
}

function shellPathSync() {
	const {PATH} = shellEnvSync();
	return PATH;
}


module.exports = function fixPath() {
	if (process.platform === 'win32') {
		return;
	}

	process.env.PATH = shellPathSync() || [
		'./node_modules/.bin',
		'/.nodebrew/current/bin',
		'/usr/local/bin',
		process.env.PATH,
	].join(':');
}
