import React, { useState, useEffect, useRef } from 'react';
import { Link, Redirect } from "react-router-dom";
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { auth } from '../firebase';

import './Chat.css';


export default function Chat(props) {
    const [yourImg, setYourImg] = useState("");
    const [theirImg, setTheirImg] = useState("");
    const [uid, setUid] = useState("");

    const auth = firebase.auth();
    const firestore = firebase.firestore();

    const dummy = useRef();

    const messagesRef = firestore.collection(props.location.state.convoRef);
    const query = messagesRef.orderBy('timestamp').limit(50);

    const [messages] = useCollectionData(query, {idField: 'id'});

    const [formValue, setFormValue] = useState("");

    const storage = firebase.storage();
	const ref = React.useRef();

    useEffect(() => {
        // gets both of your pictures
		async function fetchData() {
			firebase.auth().onAuthStateChanged(function(user) {
				if (user != null) {
					setUid(user.uid);
					storage.ref("pix").child(user.uid).getDownloadURL().then(url => {
						setYourImg({url});	
					}).catch(error => {
						console.log("Error: " + error);
                    });
                    
                    let path = props.location.state.convoRef.split("/");

                    firestore.collection(path[0]).doc(path[1])
                    .get()
                    .then(function(doc) {
                        if(doc.exists) {
                            const theirUID = (doc.data().uid1 != user.uid) ? doc.data().uid1 : doc.data().uid2;
                            storage.ref("pix").child(theirUID).getDownloadURL().then(url => {
                                setTheirImg({url});
                            }).catch(error => {
                                console.log("Error: " + error);
                            })
                        } else {
                            console.log("Convo doesn't exist???")
                        }
                    }).catch(error => {
                        console.log("Error: " + error);
                    })
			
				}
				else
					console.log("not logged in");
			});
		}
	
		fetchData();
    }, []);
    
    const sendMessage = async(e) => {

        // stop refresh
        e.preventDefault();

        // add the message
        await messagesRef.add({
            content: formValue,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            uid
        });


        setFormValue("");

        dummy.current.scrollIntoView({ behavior: 'smooth'});
    }

	return (
        <div>
            <Link to='/home'>Home</Link>
            <h2>Chat</h2>
            <div className="App">
                <div>
                    {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} yourImgUrl={yourImg.url} theirImgUrl={theirImg.url} currentUser={uid}/>)}

                    <div ref={dummy}></div>

                </div>
                <form onSubmit={sendMessage}>
                    <input value={formValue} onChange={(e) => setFormValue(e.target.value)}/>
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
	)
	
}

function ChatMessage(props) {
    const { content, uid } = props.message;

    const messageClass = (uid === props.currentUser) ? 'sent' : 'recieved';
    const photoURL = (uid === props.currentUser) ? props.yourImgUrl : props.theirImgUrl;

    return (
        <div className={`message ${messageClass}`}>
            <img src={photoURL}/>
            <p>{content}</p>    
        </div>
    )
}