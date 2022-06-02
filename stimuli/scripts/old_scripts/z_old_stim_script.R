path <- '/Users/chrisiyer/Thesis_Folder/face_experiment/stimuli/faces';

black_faces <- dir(paste0(path, '/Black'))
white_faces <- dir(paste0(path, '/Caucasian'))

for (i in 1:length(black_faces)) {
  black_faces[i] <- substr(black_faces[i], 1, 12);
}
for (j in 1:length(white_faces)) {
  white_faces[j] <- substr(white_faces[j], 1, 12);
}

ubf <- unique(black_faces);
uwf <- unique(white_faces);

fubf <- array();
fuwf <- array();

for (b in ubf) {
  if (substr(b,8,8) == '1') {
    fubf <- append(fubf, b);
  }
}
for (w in uwf) {
  if (substr(w,8,8) == '1') {
    fuwf <- append(fuwf, w);
  }
}

fubf <- fubf[-1];
fuwf <- fuwf[-1];

remove_fubf <- c("BF0604_1101_", "BF0609_1101_", "BM0601_1100_");
fubf <- fubf [! fubf %in% remove_fubf]
remove_fuwf <- c("CF0021_1110_", "CF0035_1101_", "CM0013_1111_", "CM0021_1101_", "CM0034_1100_")
fuwf <- fuwf [! fuwf %in% remove_fuwf]

all_faces <- c(fubf, fuwf);
test <- c('hello', 'chris')
for (s in all_faces) {
  path <- paste0("/Users/chrisiyer/Thesis_Folder/face_experiment/stimuli/faces/Black/", s, "90L.jpg");
  path2 <- paste0("/Users/chrisiyer/Thesis_Folder/face_experiment/stimuli/faces/Caucasian/", s, "90L.jpg");
  if (!file.exists(path)) {
    if (!file.exists(path2)) {
      test <- append(test, path2)
    }
  }
}
test

paste(fubf, sep="' '", collapse=", ")
paste(shQuote(fuwf), collapse=", ")