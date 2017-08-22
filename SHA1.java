import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Formatter;
import java.security.DigestInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.io.InputStream;
import java.util.List;
import java.util.Comparator;
import java.io.FileInputStream;
import java.io.File;
import java.io.FileNotFoundException;

public class SHA1 {

    private static class JarEntryComparator implements Comparator<JarEntry> {

	@Override
	public int compare(final JarEntry entry1, final JarEntry entry2) {
	    final String name1 = entry1.getName();
	    final String name2 = entry2.getName();
	    return name1.compareTo(name2);
	}

    }
    public static MessageDigest getDigest() throws NoSuchAlgorithmException {
	return MessageDigest.getInstance("SHA-1");
    }


    private static String getJarDigest(String file) throws FileNotFoundException, IOException{
	MessageDigest digest = null;
	try {
	    digest = getDigest();
	}
	catch (final NoSuchAlgorithmException e) {
	    throw new RuntimeException(e);
	}

	if (file != null) {
	    final JarFile jar = new JarFile(file);
	    final List<JarEntry> list = Collections.list(jar.entries());
	    Collections.sort(list, new JarEntryComparator());

	    for (final JarEntry entry : list) {
		digest.update(entry.getName().getBytes("ASCII"));
		InputStream inputStream = jar.getInputStream(entry);
		// .properties files have a date in a comment; let's ignore this for the checksum
		// For backwards-compatibility, activate the .properties mangling only from June 15th, 2012
		if (entry.getName().endsWith(".properties")) {
		    inputStream = new SkipHashedLines(inputStream);
		}
		// same for manifests, but with July 6th, 2012
		if (entry.getName().equals("META-INF/MANIFEST.MF")) {
		    inputStream = new FilterManifest(inputStream, true);
		}

		updateDigest(inputStream, digest);
	    }
	    jar.close();
	}
	return toHex(digest.digest());
    }



    public static void updateDigest(final InputStream input,
				    final MessageDigest digest) throws IOException
    {
	final byte[] buffer = new byte[65536];
	final DigestInputStream digestStream = new DigestInputStream(input, digest);
	while (digestStream.read(buffer) >= 0); /* do nothing */
	digestStream.close();
    }

    public final static char[] hex = { '0', '1', '2', '3', '4', '5', '6', '7',
				       '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

    public static String toHex(final byte[] bytes) {
	final char[] buffer = new char[bytes.length * 2];
	for (int i = 0; i < bytes.length; i++) {
	    buffer[i * 2] = hex[(bytes[i] & 0xf0) >> 4];
	    buffer[i * 2 + 1] = hex[bytes[i] & 0xf];
	}
	return new String(buffer);
    }

    public static byte[] createSha1(File file) throws Exception {
	MessageDigest digest = MessageDigest.getInstance("SHA-1");
	InputStream fis = new FileInputStream(file);
	int n = 0;
	byte[] buffer = new byte[8192];
	while (n != -1) {
	    n = fis.read(buffer);
	    if (n > 0) {
		digest.update(buffer, 0, n);
	    }
	}
	return digest.digest();
    }

    public static void main(String args[]){
	try{
	    System.out.println(getJarDigest(args[0]));
	}
	catch(Exception e){System.out.println(e);}
    }
}
