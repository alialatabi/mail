document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').addEventListener('submit', send_mail);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

}

function send_mail(event) {
    event.preventDefault()

    let recipients = document.querySelector('#compose-recipients').value
    let subject = document.querySelector('#compose-subject').value
    let body = document.querySelector('#compose-body').value


    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    }).then(response => load_mailbox('sent'))
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    // Show the mailbox name & clear previous child elements
    const view = document.querySelector('#emails-view');
    view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


    fetch('/emails/' + mailbox)
        .then(response => response.json())
        .then(emails => {

            emails.forEach(email => {
                let div = document.createElement('div');
                div.className = email['read'] ? "email-list-item-read" : "email-list-item-unread";
                // div.className = 'form-control container';

                div.innerHTML = `
            <span class="sender col-3"> <b>${email['sender']}</b> </span>
            <span class="subject col-6"> ${email['subject']} </span>
            <span class="timestamp col-3"> ${email['timestamp']} </span>
        `;

                div.addEventListener('click', () => load_email(email['id']));
                view.appendChild(div);
            });
        })
}

function load_email(id) {
    fetch('/emails/' + id)
        .then(response => response.json())
        .then(email => {

            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';
            document.querySelector('#email-view').style.display = 'block';

            const view = document.querySelector('#email-view');
            view.innerHTML = `
                <p class="p_mail">From:  <span>${email['sender']}</span></p>
                <p class="p_mail">To: <span>${email['recipients']}</span></p>
                <p class="p_mail">Subject: <span>${email['subject']}</span></p>
                <p class="p_mail">Time: <span>${email['timestamp']}</span></p> 
                <p class="p_mail">Email Body:</p>
                <p>${email['body']}</p>
                `;

            let reply = document.createElement('button');
            reply.className = "btn btn-outline-primary m-1 float-right";
            reply.innerHTML = 'Reply';
            reply.addEventListener('click',
                ()=>{
                    document.querySelector('#compose-view').style.display = 'block';
                    document.querySelector('#email-view').style.display = 'none';

                    let from = document.querySelector('#from').value
                    if (email['sender'] === from){
                        document.querySelector('#compose-recipients').value = email['recipients']
                    }else{
                        document.querySelector('#compose-recipients').value = email['sender']
                    }

                    let subject = email['subject'];
                    if (subject.split(" ", 1)[0] !== "Re:") {
                        subject = "Re: " + subject;
                    }
                    document.querySelector('#compose-subject').value = subject
                })
            view.appendChild(reply)

            let archive_btn = document.createElement('button');
            archive_btn.className = "btn btn-outline-primary m-1";
            archive_btn.innerHTML = !email['archived'] ? 'Archive' : 'Unarchive';
            archive_btn.addEventListener('click',
                ()=>{
                    fetch('/emails/'+ id,{
                        method: 'PUT',
                        body: JSON.stringify({
                            archived : !email['archived']
                        })
                    }).then(response => load_mailbox('inbox'))
                })
            view.appendChild(archive_btn)

            if (!email['read']) {
                fetch('/emails/' + id, {
                    method: 'PUT',
                    body: JSON.stringify({read: true})
                })
            }
        })

}



