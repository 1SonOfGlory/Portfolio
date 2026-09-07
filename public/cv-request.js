document.querySelector('#cv-request').addEventListener('submit',event=>{
 event.preventDefault();
 const name=document.querySelector('#cv-name').value.trim();
 const email=document.querySelector('#cv-email').value.trim();
 const reason=document.querySelector('#cv-reason').value.trim();
 const body=`Hi Jabess,\n\nI would like to request your research CV.\n\nName: ${name}\nReply email: ${email}\nReason: ${reason}\n\nThank you.`;
 window.location.href='mailto:omanijabess47@gmail.com?subject='+encodeURIComponent('Research CV request')+'&body='+encodeURIComponent(body);
 document.querySelector('#cv-status').textContent='Your email app should open. Send the message to complete your request. If it does not open, email omanijabess47@gmail.com directly.';
});
