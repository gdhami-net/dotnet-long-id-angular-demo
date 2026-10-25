using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using LongIdDemo.Api;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Xunit.Abstractions;

namespace LongIdDemo.Tests;

public class WireTests(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private async Task<string> Get(HttpClient client, string url)
    {
        var text = await client.GetStringAsync(url);
        output.WriteLine($"GET {url}\n{text}");
        return text;
    }

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    [Fact]
    public async Task By_default_the_long_goes_out_as_a_json_number()
    {
        var text = await Get(factory.CreateClient(), "/raw/orders");
        Assert.Contains("\"id\":1234567890123456789,", text);
        Assert.Contains("\"id\":42,", text);
    }

    [Fact]
    public async Task The_attribute_writes_the_id_as_a_string_and_leaves_other_numbers_alone()
    {
        var text = await Get(factory.CreateClient(), "/orders");
        Assert.Contains("\"id\":\"1234567890123456789\"", text);
        Assert.Contains("\"id\":\"42\"", text);
        Assert.Contains("\"total\":19.99", text);
    }

    [Fact]
    public async Task The_number_javascript_sends_back_finds_nothing()
    {
        var client = factory.CreateClient();
        var byUrl = await client.GetAsync("/raw/orders/1234567890123456800");
        var byBody = await client.PutAsync("/raw/orders",
            Json("""{"id":1234567890123456800,"customer":"Snowflake Ltd","total":19.99}"""));
        output.WriteLine(await byUrl.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NotFound, byUrl.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, byBody.StatusCode);
    }

    [Fact]
    public async Task The_string_id_comes_back_in()
    {
        var client = factory.CreateClient();
        var put = await client.PutAsync("/orders",
            Json("""{"id":"1234567890123456789","customer":"Snowflake Ltd","total":19.99}"""));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
    }

    [Fact]
    public async Task The_unchanged_api_also_accepts_a_string_id_because_web_defaults_allow_it()
    {
        // JsonSerializerDefaults.Web sets NumberHandling = AllowReadingFromString.
        Assert.Equal(JsonNumberHandling.AllowReadingFromString,
            new JsonSerializerOptions(JsonSerializerDefaults.Web).NumberHandling);
        var put = await factory.CreateClient().PutAsync("/raw/orders",
            Json("""{"id":"1234567890123456789","customer":"Snowflake Ltd","total":19.99}"""));
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
    }

    [Fact]
    public async Task A_global_setting_turns_every_number_into_a_string()
    {
        var global = factory.WithWebHostBuilder(b => b.UseSetting("GlobalNumbersAsStrings", "true"));
        var text = await Get(global.CreateClient(), "/raw/orders");
        Assert.Contains("\"id\":\"1234567890123456789\"", text);
        Assert.Contains("\"total\":\"19.99\"", text);
    }

    [Fact]
    public async Task The_openapi_document_says_integer_or_string_with_and_without_the_attribute()
    {
        var text = await factory.CreateClient().GetStringAsync("/openapi/v1.json");
        var schemas = JsonNode.Parse(text)!["components"]!["schemas"]!;
        var withAttr = schemas["Order"]!["properties"]!["id"]!.ToJsonString();
        var without = schemas["RawOrder"]!["properties"]!["id"]!.ToJsonString();
        output.WriteLine($"Order.id    {withAttr}\nRawOrder.id {without}");
        Assert.Equal(without, withAttr);
        Assert.Contains("\"type\":[\"integer\",\"string\"]", withAttr);
    }

    [Fact]
    public async Task With_strict_reading_the_openapi_document_says_integer_for_the_unattributed_id()
    {
        var strict = factory.WithWebHostBuilder(b => b.UseSetting("StrictNumbers", "true"));
        var text = await strict.CreateClient().GetStringAsync("/openapi/v1.json");
        var schemas = JsonNode.Parse(text)!["components"]!["schemas"]!;
        var withAttr = schemas["Order"]!["properties"]!["id"]!.ToJsonString();
        var without = schemas["RawOrder"]!["properties"]!["id"]!.ToJsonString();
        output.WriteLine($"strict: Order.id    {withAttr}\nstrict: RawOrder.id {without}");
        Assert.Contains("\"type\":[\"integer\",\"string\"]", withAttr);
        Assert.DoesNotContain("string", without);
    }
}
