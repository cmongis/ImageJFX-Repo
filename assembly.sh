

mkdir -p $1
git clone https://github.com/cmongis/imagejfx-core || echo "Git repo already exists"
echo "Going to ImageJ Folder $1"
cd $1 || exit 3
cd imagejfx-core || git clone http://github.com/cmongis/imagejfx-core.git
cd imagejfx-core || echo ":-)"
echo $(pwd)
echo "<br>Pull modification<br>"
git fetch origin || exit
git reset --hard origin/master

echo "<br>Deleting libraries"
rm -Rfv target/*
mvn -e assembly:assembly || mvn3 -e assembly:assembly
mkdir -p ../jars
rm ../jars/*
mv -v target/imagejfx-core*bin/lib/* ../jars
mv -v target/imagejfx-core*.jar ../jars
exit
