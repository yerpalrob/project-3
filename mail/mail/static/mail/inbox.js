document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // Send email
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  // Reply to email
  document.querySelector('#reply').addEventListener('click', reply_email);
  // Archive/Unarchive email
  document.querySelector('#archive').addEventListener('click', (evt) => archive_email(evt, true));
  document.querySelector('#unarchive').addEventListener('click', (evt) => archive_email(evt, false));


  // By default, load the inbox
  load_mailbox('inbox');
});

// Load composition view with information prefilled for replying
function reply_email(evt) {
  console.log("read_email", evt.target);
  var email_id = evt.target.getAttribute('data-email_id');
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  // Prefill composition form appropriately
  fetch('/emails/' + email_id, {
		method: 'GET',
	})
	.then(response => response.json())
	.then(read_email => { 
		document.querySelector('#compose-recipients').value = `${read_email.sender}`;
		document.querySelector('#compose-subject').value = `RE: ${read_email.subject}`;
		document.querySelector('#compose-body').value = `
		**On ${read_email.timestamp}, ${read_email.recipients} wrote: ${read_email.body}`;
	});

}

// Archive an email using PUT
function archive_email(evt, archived) {
  console.log("read_email", evt.target);
  var email_id = evt.target.getAttribute('data-email_id');
  fetch('/emails/' + email_id, {
	method: 'PUT',
    body: JSON.stringify({
		archived: archived
    })
  })
.then(load_mailbox('inbox'));

}

// Send email 
function send_email(event) {
	console.log('in send email');
	event.preventDefault();
		const myHeaders = new Headers();
		myHeaders.append('Content-Type', 'application/json');

		fetch('/emails', {
			method: 'POST',
			headers: myHeaders,
			body: JSON.stringify({
				recipients: document.getElementById('compose-recipients').value,
				subject: document.getElementById('compose-subject').value,
				body: document.getElementById('compose-body').value
			})
		})
		.then(response => response.json())
		.then(result => {
			// Print result
			console.log('result', result);
		})
		.then(load_mailbox('sent'));
}

// Load the email view of the clicked email
function read_email(evt) {
  console.log("read_email", evt.target);
  var email_id = evt.target.getAttribute('data-email_id');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch('/emails/' + email_id, {
		method: 'GET',
	})
	.then(response => response.json())
	.then(result => {
		// Loop over properties in result
		for (var property in result) {
			// If the property exists on result object itself
			if (result.hasOwnProperty(property)) {
				// If it has a corresponding element in the page, update the text of that element.
				// (Not all properties of the email are shown directly.)
				var element = document.querySelector(`#email-${property}`);
				if (element) {
					element.innerHTML = result[property];
				}
			}
		}
		console.log(result.archived)
		var archiveButton = document.querySelector('#archive');	
		var unarchiveButton = document.querySelector('#unarchive');	
		var replyButton = document.querySelector('#reply');
		replyButton.setAttribute('data-email_id', email_id);				

		if (result.archived) {
			unarchiveButton.classList.remove('d-none');
			unarchiveButton.setAttribute('data-email_id', email_id);
			archiveButton.classList.add('d-none');
			
		}
		else {
			archiveButton.classList.remove('d-none');
			archiveButton.setAttribute('data-email_id', email_id);	
			unarchiveButton.classList.add('d-none');

		}

	})
	.then(() => { 
		fetch ('/emails/' + email_id, {
	method: 'PUT',
    body: JSON.stringify({
		read: true
    })
  })
	})
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}
	
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name (changed to make it easier to edit the div)
  var emailsView = document.querySelector('#emails-view');
  document.querySelector('#emails-view h3').innerHTML = `
	${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}
	
`;

	var parentNode = document.querySelector('#email-list');
	// clear children from the table before you add new ones
	parentNode.innerHTML = ''
	
	fetch('/emails/' + mailbox, {
			method: 'GET',
		})
		.then(response => response.json())
		.then(result => {
			// Print result
			console.log('result', result);
			for (var i = 0; i < result.length; i++) {
				var currentEmail = result[i];
				
				// Create anchor element. 
                var a = document.createElement('a');  
                var div = document.createElement (`div`);
				div.classList.add(`read_${currentEmail.read}`);
                // Create the text node for anchor element. 
                var link = document.createTextNode(`From: ${currentEmail.sender}, Subject: ${currentEmail.subject} | ${currentEmail.body} | Received: ${currentEmail.timestamp}`); 
                  
                // Append the text node to anchor element. 
                a.appendChild(link);  
                  
				a.setAttribute('data-email_id', currentEmail.id);
				a.addEventListener('click', read_email);
                  
                // Append the anchor element to the body. 
				div.appendChild(a);
                parentNode.appendChild(div);
			}
		});
}
 