const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');


/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    const sentencePattern = new RegExp(/s+[^.!?]*[.!?]/);
    const emailPattern = new RegExp (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);

    const titleMatched = title.match(sentencePattern).join('');
    const authorMatched = author.match(sentencePattern).join('');
    const matchedEmail = email.match(emailPattern).join('');
   
    if (titleMatched.length < title.length || authorMatched.length < author.length || matchedEmail.length < email.length) throw new Error ('Invalid characters used');

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if (fileExt === '.jpeg' || '.png' || '.gif' && title.length <= 25 && author.length <= 50) {
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {


  try {
    const ip = requestIp.getClientIp(req); 
    console.log('this is your ip', ip);
    const photoToUpdate = await (Photo.findById({ _id: req.params.id }));
    const voter = await (Voter.findOne({user: ip}));
    const voterVotedOnPhoto = voter.votes.includes(photoToUpdate);

    if (voter && voterVotedOnPhoto) {
      res.status(404).json({ message: 'You can`t vote' })

    } else {
      const voter = await (Voter.insertOne({user: ip, votes: []}));
      console.log('this is voter', voter);
      const allVotes = voter.votes;
      console.log(allVotes);
      const updatedVotes = allVotes.push(req.params.id);
      voter.votes = updatedVotes;
      voter.save();
     // Voter.insertOne({user: ip, votes: [req.params.id]});
     //voter.votes.push(req.params.id);
      
    }

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }


 
  /*try {    
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const chosenPhoto = await Voter.findOne({ votes: photoToUpdate });
    const voter = await Voter.findOne({user: ip});
    const voterVotedOnPhoto = voter.votes.includes(chosenPhoto);
    if(voter && voterVotedOnPhoto) res.status(505).json({ message: 'Photo already chosen' });
    else {
      voter.save();
      voters.votes.push(chosenPhoto);
      photoToUpdate.votes++;
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }*/
};
