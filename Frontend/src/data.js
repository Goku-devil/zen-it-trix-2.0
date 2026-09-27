import data from './data.json' with { type: 'json' }

export const technicalEvents = [
    {
        number: '01',
        name: 'Paper Presentation',
        description: 'Turn your boldest idea into a story that moves the room.',
        meta: 'Solo / duo · 8 min',
        type: 'both',
        team_and_individual: true,
        defaultTeamSize: 2,
        maxTeamSize: 2,
        contact: 'tech@zenittrix.in',
        phone: '8234353434',
        inCharge: 'Dr. Anika Rao',
        venue: 'Seminar Hall A',
        rules: ['Maximum 8 minutes per team', 'Submit slides before the event', 'Decision of judges is final'],
        color: 'blue',
    },
    {
        number: '02',
        name: 'Code Debugging',
        description: 'Read the clues, find the flaw, and ship the cleanest fix.',
        meta: 'Individual · 30 min',
        type: 'individual',
        team_and_individual: false,
        defaultTeamSize: 1,
        maxTeamSize: 1,
        contact: 'debug@zenittrix.in',
        phone: '8234353435',
        inCharge: 'Kiran Kumar',
        venue: 'Programming Lab 1',
        rules: ['Individual participation only', 'No internet or AI tools', 'Complete as many tasks as possible'],
        color: 'blue',
    },
    {
        number: '03',
        name: 'UI/UX Sprint',
        description: 'Design a useful interface for a problem worth solving.',
        meta: 'Teams of 2 · 45 min',
        type: 'team',
        team_and_individual: false,
        defaultTeamSize: 2,
        maxTeamSize: 2,
        contact: 'design@zenittrix.in',
        phone: '8234353436',
        inCharge: 'Meera Nair',
        venue: 'Design Studio',
        rules: ['Teams must have two members', 'Use the supplied design prompt', 'Present the final prototype'],
        color: 'blue',
    },
    {
        number: '04',
        name: 'Tech Quiz',
        description: 'Race through technology, logic, and the internet age.',
        meta: 'Teams of 2 · 20 min',
        type: 'team',
        team_and_individual: false,
        defaultTeamSize: 2,
        maxTeamSize: 2,
        contact: 'quiz@zenittrix.in',
        phone: '8234353437',
        inCharge: 'Arjun Menon',
        venue: 'Smart Classroom 2',
        rules: ['Two members per team', 'No electronic devices', 'Tie-breaker round may be conducted'],
        color: 'blue',
    },
    {
        number: '05',
        name: 'Project Expo',
        description: 'Show the room what you built and why it matters.',
        meta: 'Teams of 3 · 10 min',
        type: 'team',
        team_and_individual: false,
        defaultTeamSize: 3,
        maxTeamSize: 5,
        contact: 'expo@zenittrix.in',
        phone: '8234353438',
        inCharge: 'Priya Shah',
        venue: 'Innovation Lab',
        rules: ['Bring a working project demo', 'Teams get 10 minutes to present', 'Projects must be original work'],
        color: 'blue',
    },
    {
        number: '06',
        name: 'Robo Race',
        description: 'Build, steer, and race your machine through the course.',
        meta: 'Teams of 3 · Open track',
        type: 'team',
        team_and_individual: false,
        defaultTeamSize: 3,
        maxTeamSize: 5,
        contact: 'robo@zenittrix.in',
        phone: '8234353439',
        inCharge: 'Vikram Das',
        venue: 'Robotics Arena',
        rules: ['Use only approved components', 'One practice run per team', 'Unsafe robots will be disqualified'],
        color: 'blue',
    },
]

export const nonTechnicalEvents = [
    {
        number: '01',
        name: 'Free Fire',
        description: 'Drop in, team up, and be the last squad standing.',
        meta: 'Squads of 4 · Open lobby',
        type: 'team',
        team_and_individual: false,
        defaultTeamSize: 4,
        maxTeamSize: 5,
        contact: 'play@zenittrix.in',
        phone: '8234353440',
        inCharge: 'Rohan Paul',
        venue: 'Open Arena',
        rules: ['Teams must register before the match', 'No emulators or outside devices', 'Players must follow the referee call'],
        color: 'coral',
    },
    {
        number: '02',
        name: 'Movie Mania',
        description: 'A fast, loud celebration of the films we cannot forget.',
        meta: 'Teams of 2 · Open quiz',
        type: 'team',
        team_and_individual: false,
        defaultTeamSize: 2,
        maxTeamSize: 2,
        contact: 'mania@zenittrix.in',
        phone: '8234353441',
        inCharge: 'Sara Joseph',
        venue: 'Auditorium',
        rules: ['Teams of two participants', 'No phones during the quiz', 'Fastest correct answer wins'],
        color: 'coral',
    },
    {
        number: '03',
        name: 'Minute To Win It',
        description: 'Tiny challenges, huge energy, zero time to overthink.',
        meta: 'Open entry · 60 seconds',
        type: 'both',
        team_and_individual: true,
        defaultTeamSize: 1,
        maxTeamSize: 5,
        contact: 'fun@zenittrix.in',
        phone: '8234353442',
        inCharge: 'Nikhil Raj',
        venue: 'Activity Court',
        rules: ['Each challenge has one minute', 'Participants must follow safety instructions', 'Organizers decision is final'],
        color: 'coral',
    },
]

export const allEvents = [...technicalEvents, ...nonTechnicalEvents]

export const yearsOfStudy = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
]

export const getEventConfig = (eventName) => {
    return allEvents.find((e) => e.name === eventName) || null
}

export const isTeamEvent = (eventName) => {
    const event = getEventConfig(eventName)
    return event ? (event.type === 'team' && !event.team_and_individual) : false
}

export const isIndividualEvent = (eventName) => {
    const event = getEventConfig(eventName)
    return event ? (event.type === 'individual' && !event.team_and_individual) : false
}

export const isTechnicalEvent = (eventName) => {
    return technicalEvents.some((e) => e.name === eventName)
}

export const isNonTechnicalEvent = (eventName) => {
    return nonTechnicalEvents.some((e) => e.name === eventName)
}

export const getFilteredEvents = (eventsList, registrationType) => {
    if (registrationType === 'individual') {
        return eventsList.filter((e) => e.type === 'individual' || e.team_and_individual === true)
    }
    if (registrationType === 'team') {
        return eventsList.filter((e) => e.type === 'team' || e.team_and_individual === true)
    }
    return eventsList
}

export const schedule = [
    ['09:30 AM', 'Registration & check-in', 'Main foyer'],
    ['10:00 AM', 'Inauguration', 'Auditorium'],
    ['10:45 AM', 'Technical events begin', 'Innovation lab'],
    ['01:00 PM', 'Lunch break', 'Campus courtyard'],
    ['02:00 PM', 'Non-technical events', 'Open arena'],
    ['04:30 PM', 'Prize ceremony', 'Auditorium'],
]

export const districts = data.districts
export const district = data.districts
