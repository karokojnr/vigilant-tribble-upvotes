var app = new Vue({
    el: '#app',
    data: {
        requests: [],
    },
    methods: {
        upvoteRequest(id) {
            //console.log(id);
            const upvote = firebase.functions().httpsCallable('upvote');
            upvote({ id })
                .catch(error => {
                    // console.log(error.message);
                    showNotification(error.message);
                });
        }
    },
    mounted() {
        const ref = firebase.firestore().collection('requests').orderBy('upvotes', 'desc');;
        ref.onSnapshot(snapshot => {
            // snapshot represents the collection with its current data
            // state with all of its data at the time this function fires.
            let requests = [];
            snapshot.forEach(doc => {
                requests.push({ ...doc.data(), id: doc.id });
            });
            this.requests = requests;
        });
    }
});