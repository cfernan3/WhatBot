//Ref:http://toolsqa.com/selenium-webdriver/browser-commands/

package selenium.tests;

import static org.junit.Assert.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import io.github.bonigarcia.wdm.ChromeDriverManager;

public class WebTest
{
	private static WebDriver driver;
	
	public static String URL = "https://parkwoodgang.slack.com";
	
	@BeforeClass
	public static void setUp() throws Exception 
	{
		ChromeDriverManager.getInstance().setup();
		driver = new ChromeDriver();
		driver.get(URL);
        assertEquals("Slack", driver.getTitle());		

    	WebDriverWait wait = new WebDriverWait(driver, 30);
    	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[@id='signin_form']/p[1]/strong[1]")));
    	WebElement email = driver.findElement(By.xpath("//*[@id='email']"));
    	email.sendKeys("whatbot.ncsu@gmail.com");
    	WebElement password = driver.findElement(By.xpath("//*[@id='password']"));
    	password.sendKeys("*******");
    	WebElement signin = driver.findElement(By.xpath("//*[@id='signin_btn']/span[1]"));
    	signin.click();
	}
	
	@AfterClass
	public static void  tearDown() throws Exception
	{
		driver.close();
		driver.quit();
	}
	
	@Test
	public void StartStandup() throws Exception
	{
		driver.get("https://parkwoodgang.slack.com/messages/D7LJ7H9U4/");
		WebDriverWait wait = new WebDriverWait(driver, 70);
    	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]")));
    	List<WebElement> Start = driver.findElements(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]"));
    	Thread.sleep(3000);
    	Start.get(Start.size() - 1).click();
    	Thread.sleep(3000); 
    	
    	// Configuring start time
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']")));
        WebElement startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        WebElement bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("I completed the DevOps Test Analysis Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Will be working on DevOps Deployment Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not yet");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not yet");
        bot.sendKeys(Keys.RETURN);
        
        driver.get("https://parkwoodgang.slack.com/messages/C7HTHUL3B/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'whatbot.ncsu has completed the standup. The reponses are as follows-']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'whatbot.ncsu has completed the standup. The reponses are as follows-']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
	}
	
	@Test
	public void SnoozeStandup() throws Exception
	{
		driver.get("https://parkwoodgang.slack.com/messages/D7LJ7H9U4/");		

    	WebDriverWait wait = new WebDriverWait(driver, 70);
    	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]")));
    	List<WebElement> Snooze = driver.findElements(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Snooze')]"));
    	Snooze.get(0).click();
    	Thread.sleep(5000);
    	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]")));
    	List<WebElement> Start = driver.findElements(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]"));
    	Thread.sleep(3000);
    	Start.get(Start.size() - 1).click();
    	Thread.sleep(3000); 
    	
    	// Configuring start time
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']")));
        WebElement startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        WebElement bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("I completed the DevOps Test Analysis Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Will be working on DevOps Deployment Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not yet");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not yet");
        bot.sendKeys(Keys.RETURN);
        
        driver.get("https://parkwoodgang.slack.com/messages/C7HTHUL3B/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'whatbot.ncsu has completed the standup. The reponses are as follows-']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'whatbot.ncsu has completed the standup. The reponses are as follows-']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
	}
	
	@Test
	public void IgnoreStandup() throws Exception
	{
		driver.get("https://parkwoodgang.slack.com/messages/D7LJ7H9U4/");		
    	WebDriverWait wait = new WebDriverWait(driver, 70);
    	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]")));
    	List<WebElement> Ignore = driver.findElements(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Ignore')]"));
    	Ignore.get(0).click();
    	Thread.sleep(5000); 
	}
	
	@Test
	public void RedoStandup() throws Exception
	{
		driver.get("https://parkwoodgang.slack.com/messages/D7LJ7H9U4/");
		WebDriverWait wait = new WebDriverWait(driver, 70);
    	wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]")));
    	List<WebElement> Start = driver.findElements(By.xpath("//button[@class='btn btn_attachment'and contains(., 'Start')]"));
    	Thread.sleep(3000);
    	Start.get(Start.size() - 1).click();
    	Thread.sleep(3000); 
    	
    	// Configuring start time
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']")));
        WebElement startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        WebElement bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("I completed the DevOps Test Analysis Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Will be working on DevOps Deployment Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not Yet");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("y");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
    	
    	// Configuring start time
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What did you accomplish yesterday?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("I completed the DevOps Test Analysis Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'What will you work on today?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Will be working on DevOps Deployment Milestone");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'Is there anything blocking your progress?']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not yet");
        bot.sendKeys(Keys.RETURN);
        Thread.sleep(3000);
        
        bot = driver.findElement(By.xpath("//div[@id='msg_input']/div")); // ("msg_input").);
        bot.sendKeys("Not yet");
        bot.sendKeys(Keys.RETURN);
        
        driver.get("https://parkwoodgang.slack.com/messages/C7HTHUL3B/");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[contains(@class,'message_body') and text() = 'whatbot.ncsu has completed the standup. The reponses are as follows-']")));
        startTime = driver.findElement(
                By.xpath("//span[contains(@class,'message_body') and text() = 'whatbot.ncsu has completed the standup. The reponses are as follows-']"));
        assertNotNull(startTime);
        Thread.sleep(3000);
	}
}
