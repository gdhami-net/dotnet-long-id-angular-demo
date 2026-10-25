using System.Text.Json.Serialization;
using LongIdDemo.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

// Off by default. The tests switch it on to show what a global setting does
// to every other number in the response.
if (builder.Configuration.GetValue<bool>("GlobalNumbersAsStrings"))
{
    builder.Services.ConfigureHttpJsonOptions(o =>
        o.SerializerOptions.NumberHandling =
            JsonNumberHandling.WriteAsString | JsonNumberHandling.AllowReadingFromString);
}

var app = builder.Build();

app.MapOpenApi();
app.UseDefaultFiles();
app.UseStaticFiles();

// As is: the long goes out as a JSON number.
app.MapGet("/raw/orders", () => Store.All);
app.MapGet("/raw/orders/{id:long}", (long id) =>
    Store.Find(id) is { } o ? Results.Ok(o) : Results.NotFound(new { lookedFor = id.ToString() }));
app.MapPut("/raw/orders", (RawOrder body) =>
    Store.Find(body.Id) is { } o ? Results.Ok(o) : Results.NotFound(new { lookedFor = body.Id.ToString() }));

// Fixed: the same data through the Order record, whose ID is a string on the wire.
app.MapGet("/orders", () => Store.All.Select(Store.ToOrder));
app.MapGet("/orders/{id:long}", (long id) =>
    Store.Find(id) is { } o ? Results.Ok(Store.ToOrder(o)) : Results.NotFound(new { lookedFor = id.ToString() }));
app.MapPut("/orders", (Order body) =>
    Store.Find(body.Id) is { } o ? Results.Ok(Store.ToOrder(o)) : Results.NotFound(new { lookedFor = body.Id.ToString() }));

app.Run();

public partial class Program;
