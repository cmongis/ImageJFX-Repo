git clone https://github.com/cmongis/imagejfx-core || echo "Git repo already exists"

echo "Going to ImageJ Folder<br>"
cd imagejfx-core
echo $(pwd)
echo "<br>Pull modification<br>"
git fetch origin
git reset --hard origin/master

echo "<br>Deleting libraries"
rm -Rfv target/*
mvn -e assembly:assembly || mvn3 -e assembly:assembly
exit
