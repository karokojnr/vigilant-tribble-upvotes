const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializaApp();

// HTTP Triggers
// http endpoint request 1
// exports.randomNumber = functions.https.onRequest((request, response) => {
//   const number = Math.round(Math.random() * 100);
//   console.log(number);
//   response.send(number.toString());
// });
// // http endpoint request 2
// exports.toTheDojo = functions.https.onRequest((request, response) => {
//   response.redirect("https://karokojnr.github.io");
// });

// // http *callable function*
// // data -> Data sent to the function when it is called
// // context -> Has additional information such as the
// // authentication status of the user

// exports.sayHello = functions.https.onCall((data, context) => {
//   const name = data.name;
//   return `Hello, from ${name} :)`;
// });
// HTTP Triggers

// Auth triggers (new user sign up)
exports.newUserSignup = functions.auth.user().onCreate((user) => {
    //   console.log('user created', user.email, user.uid);
    return admin.firestore().collection('users').doc(user.uid).set({
        email: user.email,
        upvotedOn: []
    });
});

// Auth triggers (user deleted)
exports.userDeleted = functions.auth.user().onDelete((user) => {
    // console.log('user deleted', user.email, user.uid);
    const doc = admin.firestore().collection('users').doc(user.uid);
    return doc.delete();
});

// http callable function (adding a request)
exports.addRequest = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'only authenticated users can add requests'
        );
    }
    if (data.text.length > 30) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'request must be no more than 30 characters long!'
        );
    }
    return admin.firestore.collection('requets').add({
        text: data.text,
        upvotes: 0
    });
});

// http callable function (upvote)
exports.upvote = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'only authenticated users can upvote'
        );
    }
    // get refs for user doc
    const user = admin.firestore.collection('users').doc(context.auth.uid);
    const request = admin.firestore.collection('requests').doc(data.id);

    const doc = await user.get();
    // check user has not upvoted the request
    if (doc.data().upvotedOn.includes(data.id)) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'You can only upvote a request once!'
        );
    }
    // Update user array
    await user.update({
        upvotedOn: [...doc.data().upvotedOn, data.id]
    });
    // Update upvotes on the request
    return request.update({
        upvotes: admin.firestore.FieldValue.increment(1)
    });
});

// Firebase trigger to track acivities
exports.logActivities = functions.firestore.document('/{collection})/{id}')
    .onCreate((snap, context) => {
        console.log(snap.data);
        const collection = context.params.collection;
        const id = context.params.id;

        const acivities = admin.firestore.collection('activities');
        if (collection === 'requests') {
            return acivities.add({ text: 'a new tutorial request was added.' });
        }
        if (collection === 'users') {
            return acivities.add({ text: 'a new user signed up.' });
        }
        return null;
    });