/* unique identifier */
let database

/* initialize firebase */
const config = {
    apiKey: "AIzaSyCHfsmNn22SoRaBPSceIBTJU4H_apwvyJU",
    authDomain: "codepad-c2257.firebaseapp.com",
    databaseURL: "https://codepad-c2257.firebaseio.com",
    projectId: "codepad-c2257",
    storageBucket: "codepad-c2257.appspot.com",
    messagingSenderId: "978102417111"
};
firebase.initializeApp(config)

/* Authenticate with twitter */
const provider = new firebase.auth.TwitterAuthProvider()
firebase.auth().onAuthStateChanged(user => {
  if (user) initDatabase(user.uid)
  else firebase.auth().signInWithRedirect(provider)
})

const initDatabase = (uid) => {
    database = firebase.database().ref(`/${uid}`)
    initNotes()
}

const mergeNotes = (notes, data) => {
    let newNotes = Object.assign({}, emptyNotes)
    let keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
        let title = keys[i]
        if (!notes[title]) newNotes[title] = data[title]
        else if (notes[title].modified > data[title].modified) newNotes[title] = notes[title]
        else newNotes[title] = data[title]
    }
    return newNotes
}

const initNotes = () => {
    getNotes().then(data => {
        notes = mergeNotes(notes, data)
        renderSidebar(notes)
        saveLocally(notes)

        /* Start sync */
        sync(data => {
            notes = mergeNotes(notes, data)
            renderSidebar(notes)
            saveLocally(notes)
            persist(notes)
            /* Syncs notes between devices as long as the title doesn't change */
            if (notes[activeNote.title]) renderNote(activeNote.title)
        })
    })
}

const persist = (notes) => {database.set({notes})}

const getNotes = () => {
    return database.once('value').then(snapshot => {
        if (snapshot.val()) return snapshot.val().notes
        else return {}
    })
}

const sync = (callback) => {
    database.on('value', snapshot => {
        if (snapshot.val()) callback(snapshot.val().notes)
    })
}
